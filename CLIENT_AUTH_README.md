# Client Authentication System

This document describes the client authentication system implemented for the Spartan Gym web page. The system provides secure, multi-factor authentication for gym members.

## Overview

The client authentication system allows gym members to:
- Create personal accounts using their Client ID
- Sign in using multiple authentication methods (Password, PIN, Biometric)
- Access a personalized client dashboard
- Manage their own security settings

## Features

### Authentication Methods

1. **Password Authentication**
   - Traditional password-based login
   - Minimum 6 characters requirement
   - Secure password hashing using SHA-256

2. **PIN Authentication**
   - 4-6 digit security PIN
   - Quick access for frequent visitors
   - Visual PIN input with dot display

3. **Biometric Authentication** (Framework Ready)
   - Fingerprint and Face ID support
   - WebAuthn API integration ready
   - Placeholder implementation for future enhancement

### Security Features

- **Account Lockout**: 5 failed attempts lock account for 15 minutes
- **Password Hashing**: SHA-256 for secure storage
- **Session Management**: Secure client-side session storage
- **Input Validation**: Client and server-side validation
- **Error Handling**: Comprehensive error messages without information leakage

## Architecture

### Database Schema

The system extends the existing IndexedDB with a new `client_auth` store:

```typescript
interface ClientAuth {
    clientId: string;
    password: string; // Hashed password
    pin: string; // 4-6 digit PIN
    biometricData?: {
        fingerprint?: string;
        faceId?: string;
    };
    createdAt: string;
    updatedAt: string;
    lastLogin?: string;
    loginAttempts: number;
    isLocked: boolean;
    lockUntil?: string;
}
```

### Core Services

1. **clientAuthService**: Handles authentication logic
2. **ClientAuthProvider**: React context for client auth state
3. **Client Integration**: Links with existing client management system

## File Structure

```
src/
├── lib/
│   └── services/
│       ├── clientAuthService.ts    # Core authentication logic
│       ├── authService.ts          # Updated with client support
│       └── clientService.ts         # Existing client management
├── components/
│   └── auth/
│       ├── ClientAuthProvider.tsx   # React context provider
│       └── AuthProvider.tsx         # Updated main auth provider
└── app/
    ├── client/
    │   ├── layout.tsx              # Client auth layout
    │   ├── login/
    │   │   └── page.tsx           # Multi-method login page
    │   ├── signup/
    │   │   └── page.tsx           # Account creation page
    │   ├── dashboard/
    │   │   └── page.tsx           # Client dashboard
    │   └── settings/
    │       └── page.tsx           # Security settings
    └── client-kiosk/
        └── page.tsx               # Quick check-in interface
```

## Usage

### Client Sign-Up Process

1. **Client ID Verification**: Client enters their existing Client ID
2. **Account Creation**: Client creates password and PIN
3. **Auto Login**: Successful registration automatically signs in client

### Login Flow

1. **Method Selection**: Choose between Password, PIN, or Biometric
2. **Authentication**: Enter credentials based on selected method
3. **Session Creation**: Successful auth creates client session
4. **Redirect**: Client is redirected to dashboard

### Integration with Existing System

The client authentication system integrates seamlessly with the existing staff authentication:

- **Shared Database**: Uses same IndexedDB with extended schema
- **Separate Routes**: Client routes are under `/client/*`
- **Independent Sessions**: Client and staff sessions are separate
- **Unified User Interface**: Consistent design language and patterns

## Security Considerations

### Password Security
- Passwords are hashed using SHA-256 before storage
- In production, consider upgrading to bcrypt or Argon2
- Password requirements enforced (min 6 characters)

### PIN Security
- 4-6 digit requirement enforced
- Visual feedback with dot display
- Rate limiting prevents brute force attacks

### Session Management
- Client sessions stored in localStorage
- Session validation on page load
- Automatic logout on session expiry

### Account Lockout
- 5 failed attempts trigger 15-minute lockout
- Lockout timer resets after successful login
- Prevents brute force attacks

## API Reference

### clientAuthService

```typescript
// Create client authentication
createClientAuth(clientId: string, password: string, pin: string): Promise<ClientAuth>

// Authenticate client
authenticateClient(credentials: ClientCredentials): Promise<{client: any, auth: ClientAuth}>

// Update credentials
updateClientAuth(clientId: string, updates: object): Promise<ClientAuth>

// Check if auth exists
hasClientAuth(clientId: string): Promise<boolean>

// Remove auth
removeClientAuth(clientId: string): Promise<void>
```

### ClientAuthProvider Context

```typescript
interface ClientAuthContextType {
    clientUser: ClientUser | null;
    isLoading: boolean;
    error: string | null;
    signUp: (clientId: string, password: string, pin: string) => Promise<boolean>;
    signIn: (clientId: string, credentials) => Promise<boolean>;
    signInWithBiometric: (clientId: string) => Promise<boolean>;
    signOut: () => void;
    updateCredentials: (updates: object) => Promise<boolean>;
    clearError: () => void;
}
```

## Future Enhancements

### Biometric Authentication
- WebAuthn API integration
- Fingerprint/face recognition
- Hardware security key support

### Additional Features
- Two-factor authentication (2FA)
- Password reset via email
- Login history tracking
- Device management
- Social login integration

### Security Improvements
- Upgrade password hashing to bcrypt/Argon2
- Implement CSRF protection
- Add rate limiting middleware
- Security audit logging

## Testing

To test the client authentication system:

1. **Create Test Client**: Use existing client management to create a test client
2. **Sign Up**: Visit `/client/signup` and create an account
3. **Test Login**: Try all authentication methods
4. **Test Security**: Attempt failed logins to trigger lockout
5. **Test Settings**: Update password and PIN

## Troubleshooting

### Common Issues

1. **"Client ID not found"**: Ensure client exists in the system first
2. **"Account already exists"**: Client already has authentication setup
3. **"Account temporarily locked"**: Wait for lockout period or contact staff
4. **"Biometric not supported"**: Device doesn't support WebAuthn

### Debug Information

- Check browser console for error messages
- Verify IndexedDB data in developer tools
- Test with different browsers for compatibility
- Check network connectivity issues

## Conclusion

The client authentication system provides a secure, user-friendly way for gym members to access their accounts. It integrates seamlessly with the existing Spartan Gym platform while providing enhanced security features and multiple authentication options.