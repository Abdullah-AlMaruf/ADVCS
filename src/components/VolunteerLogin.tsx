// ===============================================================
// Assumed Data Model
// ===============================================================
//
// Collection: reports
// Document ID: auto-generated
// Fields:
//   - type: string (required)
//   - severity: string (required, enum: low, medium, high, critical)
//   - lat: number (optional)
//   - lng: number (optional)
//   - area: string (required, max 100 chars)
//   - description: string (required, max 1000 chars)
//   - status: string (required, enum: pending, active, completed)
//   - createdAt: timestamp (required)
//
// Collection: volunteers
// Document ID: auth.uid
// Fields:
//   - uid: string (required, must match doc ID)
//   - name: string (required, max 100 chars)
//   - phone: string (required, max 20 chars)
//   - area: string (required, max 100 chars)
//   - status: string (required, enum: idle, busy)
//   - lastLat: number (optional)
//   - lastLng: number (optional)
//
// Collection: actions
// Document ID: auto-generated
// Fields:
//   - reportId: string (required)
//   - volunteerId: string (required, must match auth.uid)
//   - status: string (required, enum: accepted, helping, completed)
//   - updatedAt: timestamp (required)
//
// ===============================================================

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ===============================================================
    // Helper Functions
    // ===============================================================

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() &&
        (get(/databases/$(database)/documents/volunteers/$(request.auth.uid)).data.role == 'admin' ||
         request.auth.token.email == "maruf23105341088@diu.edu.bd" ||
         request.auth.token.email == "momen@gmail.com");
    }

    function isValidEmail(email) {
      return email is string && email.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
    }

    function hasOnlyAllowedFields(allowedFields) {
      return request.resource.data.keys().hasOnly(allowedFields);
    }

    // ===============================================================
    // Domain Validators
    // ===============================================================

    function isValidReport(data) {
      return data.type is string && data.type.size() > 0 && data.type.size() < 50 &&
             data.severity in ['low', 'medium', 'high', 'critical'] &&
             data.area is string && data.area.size() > 0 && data.area.size() < 200 &&
             data.description is string && data.description.size() > 0 && data.description.size() < 2000 &&
             data.status in ['pending', 'active', 'completed'] &&
             data.createdAt is timestamp;
    }

    function isValidVolunteer(data) {
      return data.uid == request.auth.uid &&
             data.name is string && data.name.size() > 0 && data.name.size() < 100 &&
             data.phone is string && data.phone.size() > 0 && data.phone.size() < 20 &&
             data.area is string && data.area.size() > 0 && data.area.size() < 100 &&
             data.status in ['idle', 'busy'];
    }

    function isValidAction(data) {
      return data.reportId is string &&
             data.volunteerId == request.auth.uid &&
             data.status in ['accepted', 'helping', 'completed'] &&
             data.updatedAt is timestamp;
    }

    // ===============================================================
    // Collection Rules
    // ===============================================================

    match /reports/{reportId} {
      // Anyone can read reports (public safety)
      allow read: if true;

      // Anyone can create a report (reporting an emergency)
      allow create: if isValidReport(request.resource.data) &&
                      request.resource.data.status == 'pending';

      // Authenticated volunteers can update reports
      allow update: if isAuthenticated() &&
                      isValidReport(request.resource.data);

      // Authenticated volunteers can delete reports
      allow delete: if isAuthenticated();
    }

    match /volunteers/{volunteerId} {
      // Volunteers can read each other's basic info
      allow read: if isAuthenticated();

      // A user can create their own volunteer profile
      allow create: if isOwner(volunteerId) &&
                      isValidVolunteer(request.resource.data) &&
                      !('role' in request.resource.data); // Cannot self-assign admin

      // A user can update their own profile
      allow update: if isOwner(volunteerId) &&
                      isValidVolunteer(request.resource.data) &&
                      (request.resource.data.role == resource.data.role || isAdmin());

      allow delete: if isAdmin();
    }

    match /actions/{actionId} {
      allow read: if isAuthenticated();

      allow create: if isAuthenticated() &&
                      isValidAction(request.resource.data);

      allow update: if isAuthenticated() &&
                      isOwner(request.resource.data.volunteerId) &&
                      isValidAction(request.resource.data);

      allow delete: if isAdmin();
    }
  }
}
