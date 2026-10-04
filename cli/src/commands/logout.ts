/** `identiq logout`: removes the stored access token. */

import { clearConfig } from '../config/config';

export function logout(): void {
  clearConfig();
}
