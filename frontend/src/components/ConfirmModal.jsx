import { ShieldAlert } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full mb-4">
                        <ShieldAlert className="text-red-600 dark:text-red-400" size={32} />
                    </div>
                    <h2 className="text-xl font-bold mb-2">{title}</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                    <div className="flex justify-center gap-4 w-full">
                        <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 flex-1">
                            Cancel
                        </button>
                        <button onClick={onConfirm} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 flex-1">
                            Confirm Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
