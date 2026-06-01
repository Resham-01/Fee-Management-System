export const EditButton = ({ onClick, label = 'Edit' }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition shadow-sm"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
    {label}
  </button>
);

export const DeleteButton = ({ onClick, label = 'Delete' }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition shadow-sm"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
    {label}
  </button>
);

const ActionButtons = ({ onEdit, onDelete, editLabel, deleteLabel, showEdit = true, showDelete = true }) => (
  <div className="flex flex-wrap gap-2">
    {showEdit && onEdit && <EditButton onClick={onEdit} label={editLabel} />}
    {showDelete && onDelete && <DeleteButton onClick={onDelete} label={deleteLabel} />}
  </div>
);

export default ActionButtons;
