import { getAvatarColor } from "../utils/avatarColors";

function Avatar({
  user,
  size = "md",
  className = "",
}) {
  const name =
    user?.name || "User";

  const firstLetter =
    name.charAt(0).toUpperCase();

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={name}
        className={`
          avatar
          avatar-${size}
          ${className}
        `}
      />
    );
  }

  return (
    <div
      className={`
        avatar
        avatar-${size}
        avatar-fallback
        ${className}
      `}
      style={{
        background:
          getAvatarColor(
            user?.id || 0
          ),
      }}
      aria-label={name}
    >
      {firstLetter}
    </div>
  );
}

export default Avatar;