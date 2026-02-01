export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
}

export interface AuthResponse {
    data: {
        accessToken: string;
        user: User;
    };
    message: string;
    status: number;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface SignupDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
