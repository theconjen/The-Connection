import { http } from '../http';
import { AuthLoginReqZ, ApiUserZ, type AuthLoginReq, type ApiUser } from '../app-schema';

export async function login(body: AuthLoginReq): Promise<ApiUser> {
  AuthLoginReqZ.parse(body);
    return ApiUserZ.parse(await http('/login', { method: 'POST', body }));
}

export async function me(): Promise<ApiUser | null> {
    const d = await http('/user');
  return d ? ApiUserZ.parse(d) : null;
}

export async function logout(): Promise<void> {
    await http('/logout', { method: 'POST' });
}

export async function register(body: AuthLoginReq & { name?: string }): Promise<ApiUser> {
    return ApiUserZ.parse(await http('/register', { method: 'POST', body }));
}
