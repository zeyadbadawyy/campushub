import logo from "../assets/logo/t_logo.png";
import label from "../assets/logo/t_label.png";

function BrandLogo({
  variant = "sidebar",
  markOnly = false,
  className = "",
  onClick,
  ariaLabel = "CampusHub",
}) {
  const classes = [
    "campushub-brand",
    `campushub-brand--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        className="campushub-brand__mark"
      />

      {!markOnly && (
        <img
          src={label}
          alt="CampusHub"
          className="campushub-brand__label"
        />
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`${classes} cursor-pointer`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={classes}
      aria-label={ariaLabel}
    >
      {content}
    </div>
  );
}

export default BrandLogo;
