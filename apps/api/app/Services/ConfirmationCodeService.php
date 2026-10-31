<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class ConfirmationCodeService
{
    private const CODE_LIFETIME_MINUTES = 15;
    private const RESEND_WAIT_SECONDS = 60;
    private const MAX_ATTEMPTS = 5;

    public function deliver(User $user): void
    {
        $secret = $this->secret();
        $code = str_pad((string) random_int(0, 999_999), 6, '0', STR_PAD_LEFT);

        $user->forceFill([
            'confirmation_code_hash' => hash_hmac('sha256', $code, $secret),
            'confirmation_code_expires_at' => now()->addMinutes(self::CODE_LIFETIME_MINUTES),
            'confirmation_attempts' => 0,
        ])->save();

        try {
            $this->sendEmail($user, $code);
        } catch (\Symfony\Component\Mailer\Exception\TransportExceptionInterface|RuntimeException $exception) {
            $this->reset($user);
            throw new ConfirmationDeliveryException(
                'Unable to send the confirmation email. Check the SMTP settings.',
                previous: $exception,
            );
        }
    }

    public function requestCode(string $email): ?string
    {
        $user = User::query()->whereRaw('lower(email) = ?', [$email])->first();
        if ($user === null || $user->is_active) {
            return null;
        }

        $expiresAt = $user->confirmation_code_expires_at;
        if ($user->confirmation_code_hash !== null
            && $expiresAt !== null
            && $expiresAt->greaterThan(now()->addSeconds(
                self::CODE_LIFETIME_MINUTES * 60 - self::RESEND_WAIT_SECONDS,
            ))) {
            return 'Please wait before requesting another confirmation code.';
        }

        $this->deliver($user);

        return null;
    }

    public function confirm(string $email, string $code): bool
    {
        $user = User::query()->whereRaw('lower(email) = ?', [$email])->first();
        $secret = $this->secret();
        $expectedHash = hash_hmac('sha256', $code, $secret);
        $expiresAt = $user?->confirmation_code_expires_at;
        $valid = $user !== null
            && !$user->is_active
            && $user->confirmation_code_hash !== null
            && $expiresAt !== null
            && $expiresAt->isFuture()
            && $user->confirmation_attempts < self::MAX_ATTEMPTS
            && hash_equals($user->confirmation_code_hash, $expectedHash);

        if (!$valid) {
            if ($user !== null && !$user->is_active && $user->confirmation_code_hash !== null) {
                $user->confirmation_attempts++;
                if ($expiresAt === null || $expiresAt->isPast()
                    || $user->confirmation_attempts >= self::MAX_ATTEMPTS) {
                    $this->reset($user);
                } else {
                    $user->save();
                }
            }

            return false;
        }

        $user->forceFill(['is_active' => true]);
        $this->reset($user);

        return true;
    }

    private function sendEmail(User $user, string $code): void
    {
        $host = (string) config('mail.mailers.smtp.host', '');
        $sender = (string) config('mail.mailers.smtp.from_address', '');
        $username = (string) config('mail.mailers.smtp.username', '');
        $password = (string) config('mail.mailers.smtp.password', '');
        $useSsl = (bool) config('mail.smtp_use_ssl', false);
        $useTls = (bool) config('mail.smtp_use_tls', true);

        if ($host === '' || $sender === '') {
            throw new RuntimeException('Email is not configured; set SMTP_HOST and SMTP_FROM_EMAIL.');
        }
        if (($username === '') !== ($password === '')) {
            throw new RuntimeException('Set both SMTP_USERNAME and SMTP_PASSWORD, or leave both empty.');
        }
        if (($useSsl && $useTls) || (!$useSsl && !$useTls)) {
            throw new RuntimeException('Configure exactly one of SMTP_USE_TLS and SMTP_USE_SSL.');
        }

        Mail::raw(
            "Hello {$user->full_name},\n\n"
                ."Your Lyceum email confirmation code is: {$code}\n\n"
                .'The code expires in 15 minutes. If you did not create this account, you can ignore this email.',
            function ($message) use ($user): void {
                $message
                    ->to($user->email)
                    ->subject('Your Lyceum confirmation code');
            },
        );
    }

    private function reset(User $user): void
    {
        $user->forceFill([
            'confirmation_code_hash' => null,
            'confirmation_code_expires_at' => null,
            'confirmation_attempts' => 0,
        ])->save();
    }

    private function secret(): string
    {
        $secret = (string) config('app.jwt_secret', '');
        if (strlen($secret) < 32) {
            throw new ConfirmationDeliveryException(
                'Email confirmation is not configured; set JWT_SECRET_KEY to a random value of at least 32 characters.',
            );
        }

        return $secret;
    }
}
