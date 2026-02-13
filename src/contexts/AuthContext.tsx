import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase'; // Ensure this path is correct

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthorized: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAuthorized: false,
    signInWithGoogle: async () => { },
    logout: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Only allow mock auth in development mode to prevent production bypass
        const useMockAuth = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_AUTH === 'true';

        if (useMockAuth) {
            console.log("AuthProvider: Mock Auth Enabled");
            const mockUser = {
                uid: 'mock-user-id',
                email: 'test@example.com',
                displayName: 'Test User',
                emailVerified: true,
                isAnonymous: false,
                metadata: {},
                providerData: [],
                refreshToken: '',
                tenantId: null,
                delete: async () => { },
                getIdToken: async () => '',
                getIdTokenResult: async () => ({
                    token: '',
                    signInProvider: null,
                    claims: {},
                    authTime: '',
                    issuedAtTime: '',
                    expirationTime: '',
                }),
                reload: async () => { },
                toJSON: () => ({}),
                phoneNumber: null,
                photoURL: null,
            } as unknown as User;

            setUser(mockUser);
            setIsAuthorized(true);
            setLoading(false);
            return;
        }

        console.log("AuthProvider: Initializing auth listener...");

        let mounted = true;

        // Safety timeout in case Firebase fails to initialize or network is blocked
        const timeoutId = setTimeout(() => {
            if (mounted && loading) {
                console.error("AuthProvider: Auth check timed out after 5s");
                setLoading(false);
            }
        }, 5000);

        if (!auth || !db) {
            console.error("AuthProvider: Firebase not initialized");
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("AuthProvider: Auth state changed");
            if (currentUser) {
                try {
                    const emailRef = doc(db!, 'allowed_users', currentUser.email!);
                    console.log("AuthProvider: Checking authorization...");
                    const emailDoc = await getDoc(emailRef);

                    if (mounted) {
                        if (emailDoc.exists()) {
                            console.log("AuthProvider: User is authorized");
                            setIsAuthorized(true);
                        } else {
                            console.warn("AuthProvider: User not in allowed_users list");
                            setIsAuthorized(false);
                        }
                    }
                } catch (error) {
                    console.error("AuthProvider: Error checking authorization:", error);
                    if (mounted) setIsAuthorized(false);
                }
            } else {
                if (mounted) setIsAuthorized(false);
            }
            if (mounted) {
                setUser(currentUser);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            unsubscribe();
        };
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        if (!auth) {
            console.error("AuthProvider: Auth not initialized");
            return;
        }
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const logout = async () => {
        if (!auth) {
            console.error("AuthProvider: Auth not initialized");
            return;
        }
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthorized, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
