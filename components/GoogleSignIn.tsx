import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { UserProfile } from '../types';

interface GoogleSignInProps {
  onLoginSuccess: (user: Partial<UserProfile>) => void;
  onLoginError?: () => void;
}

interface GoogleJwtPayload {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

export const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onLoginSuccess, onLoginError }) => {
  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      try {
        const decoded = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);
        onLoginSuccess({
          name: decoded.name,
          email: decoded.email,
          id: decoded.sub,
        });
      } catch (error) {
        console.error('Error decoding JWT:', error);
        if (onLoginError) onLoginError();
      }
    }
  };

  const handleError = () => {
    console.error('Google Login Failed');
    if (onLoginError) onLoginError();
  };

  return (
    <div className="flex justify-center p-4">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        theme="filled_blue"
        shape="pill"
      />
    </div>
  );
};
