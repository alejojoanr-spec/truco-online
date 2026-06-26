export const AVATARES = [
  "/avatars/avatar_01.png",
  "/avatars/avatar_02.png",
  "/avatars/avatar_03.png",
  "/avatars/avatar_04.png",
  "/avatars/avatar_05.png",
  "/avatars/avatar_06.png",
  "/avatars/avatar_07.png",
  "/avatars/avatar_08.png",
  "/avatars/avatar_09.png",
  "/avatars/avatar_10.png",
];

export const DEFAULT_AVATAR = "/avatars/avatar_01.png";

// Devuelve la URL del PNG. Emojis legacy y valores nulos caen al default.
export function avatarSrc(val) {
  if (val && val.startsWith("/avatars/")) return val;
  return DEFAULT_AVATAR;
}
