import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

import Avatar from "./Avatar";

function UserListModal({ title, users = [], onClose }) {
  const navigate = useNavigate();

  function openProfile(userId) {
    onClose();
    navigate(`/profile/${userId}`);
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-950 dark:text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-2">
          {users.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No users yet.
            </div>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => openProfile(user.id)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Avatar user={user} size="md" />
                <span className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {user.name}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default UserListModal;
