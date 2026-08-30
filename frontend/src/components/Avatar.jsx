import { getAvatarColor } from "../utils/avatarColors";

function Avatar({
  user,
  size = "md",
  className = "",
}) {

  if (user?.avatar_url) {

    return (
      <img
        src={user.avatar_url}
        alt={user.name}
        className={`avatar avatar-${size} ${className}`}
      />
    );

  }

  return (

    <div
      className={`avatar avatar-${size} avatar-fallback ${className}`}
      style={{
        background: getAvatarColor(user?.id || 0)
      }}
    >
      {user?.name?.charAt(0)?.toUpperCase()}
    </div>

  );

}

export default Avatar;