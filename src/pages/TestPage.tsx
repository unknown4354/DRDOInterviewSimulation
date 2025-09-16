import React from 'react';
import { SupabaseTest } from '../components/SupabaseTest';
import { motion } from 'framer-motion';

const TestPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">DRDO System Test</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Test the Supabase database connection, authentication system, and core functionality
            of the DRDO AI-Powered Interview & Assessment System.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <SupabaseTest />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TestPage;