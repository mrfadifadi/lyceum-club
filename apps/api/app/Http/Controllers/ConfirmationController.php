<?php

namespace App\Http\Controllers;

use App\Services\ConfirmationCodeService;
use App\Services\ConfirmationDeliveryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ConfirmationController extends Controller
{
    public function requestCode(Request $request, ConfirmationCodeService $confirmationCodes): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'max:255', 'email'],
        ]);
        if ($validator->fails()) {
            return response()->json(['detail' => $validator->errors()->all()], 422);
        }

        $email = mb_strtolower(trim((string) $request->input('email')));
        try {
            $error = $confirmationCodes->requestCode($email);
        } catch (ConfirmationDeliveryException $exception) {
            return response()->json(['detail' => $exception->getMessage()], 503);
        }
        if ($error !== null) {
            return response()->json(['detail' => $error], 429);
        }

        return response()->json([
            'message' => 'If the account needs confirmation, a code will be sent to its email address.',
        ], 202);
    }

    public function confirm(Request $request, ConfirmationCodeService $confirmationCodes): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'max:255', 'email'],
            'code' => ['required', 'string', 'regex:/^\d{6}$/'],
        ]);
        if ($validator->fails()) {
            return response()->json(['detail' => $validator->errors()->all()], 422);
        }

        $email = mb_strtolower(trim((string) $request->input('email')));
        try {
            $confirmed = $confirmationCodes->confirm($email, (string) $request->input('code'));
        } catch (ConfirmationDeliveryException $exception) {
            return response()->json(['detail' => $exception->getMessage()], 503);
        }
        if (!$confirmed) {
            return response()->json([
                'detail' => 'The confirmation code is invalid or expired. Request a new code and try again.',
            ], 400);
        }

        return response()->json([
            'message' => 'Email confirmed successfully. You can now log in.',
        ]);
    }
}
