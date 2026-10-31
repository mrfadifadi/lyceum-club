<?php

namespace App\Http\Controllers;

use App\Models\MembershipApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Handles the two-stage membership application review workflow:
 *   1. Applicant submits → status = 'pending', hr_status = 'pending'
 *   2. HR reviews → hr_status = 'approved' | 'rejected' (with rejection reason if rejected)
 *   3. If HR approves, application forwarded to President
 *   4. President reviews → president_status = 'approved' | 'rejected' → updates top-level status
 */
class MembershipApplicationController extends Controller
{
    /** Submit a new membership application (public). */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name'       => ['required', 'string', 'min:2', 'max:100'],
            'last_name'        => ['required', 'string', 'min:2', 'max:100'],
            'email'            => ['required', 'string', 'email', 'max:255'],
            'phone'            => ['required', 'string', 'max:20'],
            'university'       => ['required', 'string', 'min:2', 'max:200'],
            'major'            => ['required', 'string', 'min:2', 'max:200'],
            'academic_year'    => ['required', 'string', 'min:1', 'max:30'],
            'motivation'       => ['required', 'string', 'min:1'],
            'skills_interests' => ['sometimes', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['detail' => $validator->errors()->all()], 422);
        }

        if (MembershipApplication::query()
            ->whereRaw('lower(email) = ?', [mb_strtolower(trim((string) $request->input('email')))])
            ->exists()) {
            return response()->json(['detail' => 'An application with this email already exists.'], 409);
        }

        $application = MembershipApplication::create([
            'first_name'       => trim((string) $request->input('first_name')),
            'last_name'        => trim((string) $request->input('last_name')),
            'email'            => mb_strtolower(trim((string) $request->input('email'))),
            'phone'            => trim((string) $request->input('phone')),
            'university'       => trim((string) $request->input('university')),
            'major'            => trim((string) $request->input('major')),
            'academic_year'    => trim((string) $request->input('academic_year')),
            'motivation'       => trim((string) $request->input('motivation')),
            'skills_interests' => trim((string) $request->input('skills_interests', '')),
            'status'           => 'pending',
            'hr_status'        => 'pending',
        ]);

        return response()->json($this->publicApplication($application), 201);
    }

    /** List all applications (admin only). */
    public function index(): JsonResponse
    {
        $applications = MembershipApplication::query()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($a) => $this->publicApplication($a));

        return response()->json($applications);
    }

    /** Get a single application (admin only). */
    public function show(int $id): JsonResponse
    {
        $application = MembershipApplication::query()->find($id);
        if ($application === null) {
            return response()->json(['detail' => 'Application not found'], 404);
        }

        return response()->json($this->publicApplication($application));
    }

    /**
     * HR review action (admin only).
     * Body: { "action": "approve" } or { "action": "reject", "reason": "..." }
     * HR can only act when hr_status = 'pending'.
     */
    public function hrReview(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->attributes->get('currentUser');

        $validator = Validator::make($request->all(), [
            'action' => ['required', 'string', 'in:approve,reject'],
            'reason' => ['required_if:action,reject', 'nullable', 'string', 'min:1', 'max:2000'],
        ]);
        if ($validator->fails()) {
            return response()->json(['detail' => $validator->errors()->all()], 422);
        }

        $application = MembershipApplication::query()->find($id);
        if ($application === null) {
            return response()->json(['detail' => 'Application not found'], 404);
        }
        if ($application->hr_status !== 'pending') {
            return response()->json(['detail' => 'HR has already reviewed this application.'], 409);
        }

        $action = $request->input('action');
        $application->hr_status           = $action === 'approve' ? 'approved' : 'rejected';
        $application->hr_rejection_reason = $action === 'reject' ? trim((string) $request->input('reason', '')) : null;
        $application->hr_reviewed_by      = $currentUser->id;
        $application->hr_reviewed_at      = now();

        if ($action === 'reject') {
            // HR rejection terminates the process
            $application->status = 'rejected';
        }
        // If approved, status stays 'pending' until President decides

        $application->save();

        return response()->json($this->publicApplication($application));
    }

    /**
     * President review action (admin only).
     * Body: { "action": "approve" } or { "action": "reject" }
     * Only available after HR has approved the application.
     */
    public function presidentReview(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->attributes->get('currentUser');

        $validator = Validator::make($request->all(), [
            'action' => ['required', 'string', 'in:approve,reject'],
        ]);
        if ($validator->fails()) {
            return response()->json(['detail' => $validator->errors()->all()], 422);
        }

        $application = MembershipApplication::query()->find($id);
        if ($application === null) {
            return response()->json(['detail' => 'Application not found'], 404);
        }
        if ($application->hr_status !== 'approved') {
            return response()->json(['detail' => 'Application has not been approved by HR yet.'], 409);
        }
        if ($application->president_status !== null) {
            return response()->json(['detail' => 'The President has already reviewed this application.'], 409);
        }

        $action = $request->input('action');
        $application->president_status      = $action === 'approve' ? 'approved' : 'rejected';
        $application->president_reviewed_by = $currentUser->id;
        $application->president_reviewed_at = now();

        // President decision is final
        $application->status      = $action === 'approve' ? 'approved' : 'rejected';
        $application->reviewed_by = $currentUser->id;
        $application->reviewed_at = now();

        $application->save();

        return response()->json($this->publicApplication($application));
    }

    private function publicApplication(MembershipApplication $a): array
    {
        return [
            'id'                    => $a->id,
            'first_name'            => $a->first_name,
            'last_name'             => $a->last_name,
            'email'                 => $a->email,
            'phone'                 => $a->phone,
            'university'            => $a->university,
            'major'                 => $a->major,
            'academic_year'         => $a->academic_year,
            'motivation'            => $a->motivation,
            'skills_interests'      => $a->skills_interests,
            'cv_path'               => $a->cv_path,
            'status'                => $a->status,
            'hr_status'             => $a->hr_status,
            'hr_rejection_reason'   => $a->hr_rejection_reason,
            'hr_reviewed_at'        => $a->hr_reviewed_at?->toISOString(),
            'president_status'      => $a->president_status,
            'president_reviewed_at' => $a->president_reviewed_at?->toISOString(),
            'created_at'            => $a->created_at?->toISOString(),
            'reviewed_at'           => $a->reviewed_at?->toISOString(),
        ];
    }
}

