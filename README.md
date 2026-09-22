# Contact List - Firebase Realtime Database

Firebase project used:
quizapp-41eb1

## IMPORTANT
For testing, Firebase Realtime Database Rules must allow read/write.

Firebase Console -> Realtime Database -> Rules:

{
  "rules": {
    ".read": true,
    ".write": true
  }
}

Click Publish.

These open rules are for development/testing only. For production, use Firebase Authentication and secure rules.

## Run
Use VS Code Live Server, Netlify, Firebase Hosting, or another web server. Do not open index.html with file:// because ES module imports may be blocked.

## Firebase path
contacts/<generated-id>/
  name
  email
  createdAt

Add, search, edit, delete and Delete All all work through Realtime Database.
