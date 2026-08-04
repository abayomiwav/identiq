import { clearConfig } from '../config/config';

export function logout(): void {
  clearConfig();
}
