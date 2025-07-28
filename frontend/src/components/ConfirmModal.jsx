import { X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
          </div>
          <div className="text-gray-600 dark:text-gray-300">{children}</div>
          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Cancel</button>
            <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;