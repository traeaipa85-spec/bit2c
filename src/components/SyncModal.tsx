import React from "react";
import { motion } from "framer-motion";

interface SyncModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black bg-opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        className="relative bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Spinner animado */}
        <div className="flex justify-center mb-6">
          <motion.div
            className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Título */}
        <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
          Account verification is required.
        </h2>

        {/* Subtítulo */}
        <h3 className="text-lg font-semibold text-gray-700 text-center mb-4">
          Establishing a secure connection
        </h3>

        {/* Texto principal */}
        <p className="text-gray-600 text-center mb-6 leading-relaxed">
          To keep your account secure, we need to sync your account via email. 
          The sync must occur immediately to verify your identity.
        </p>

        {/* Texto de status */}
        <p className="text-sm text-purple-600 text-center font-medium">
          This may take a few seconds...
        </p>

        {/* Botão de ação */}
        <motion.button
          className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Verify and synchronize
        </motion.button>
      </motion.div>
    </div>
  );
};

export default SyncModal;