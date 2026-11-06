// SPDX-License-Identifier: GPL-3.0-or-later
export function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
