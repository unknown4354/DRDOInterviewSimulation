import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Brain, Video, BarChart3, Lock, Globe, Award } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-xl font-bold text-white">DRDO Interview System</h1>
                <p className="text-xs text-blue-200">AI-Powered Assessment Platform</p>
              </div>
            </div>
            <nav className="flex items-center space-x-6">
              <Link to="/login" className="text-white hover:text-blue-200 transition-colors">
                Login
              </Link>
              <Link to="/register" className="bg-white text-blue-900 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                Register
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Next-Generation
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
              Interview Platform
            </span>
          </h1>
          <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto">
            Experience the future of recruitment with AI-powered evaluations, immersive 3D environments, 
            and real-time bias detection for fair and comprehensive candidate assessment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/dashboard" 
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-xl"
            >
              Access Dashboard
            </Link>
            <Link 
              to="/login" 
              className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all border border-white/20"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Evaluation</h3>
            <p className="text-blue-200">Advanced AI algorithms evaluate both questions and answers with bias detection and emotion analysis.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">3D Immersive Environment</h3>
            <p className="text-blue-200">Conduct interviews in realistic 3D boardrooms with spatial audio and professional avatars.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Real-Time Analytics</h3>
            <p className="text-blue-200">Comprehensive dashboards with performance metrics, insights, and detailed reporting.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Enterprise Security</h3>
            <p className="text-blue-200">Government-grade security with role-based access control and comprehensive audit trails.</p>
          </div>
        </div>

        {/* Role-Based Access */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Multi-Role Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-red-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Administrator</h3>
              <p className="text-blue-200 text-sm">System management, user oversight, and comprehensive analytics</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Selector</h3>
              <p className="text-blue-200 text-sm">Conduct interviews, evaluate candidates, and manage assessments</p>
            </div>

            <div className="text-center">
              <div className="bg-green-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Candidate</h3>
              <p className="text-blue-200 text-sm">Join interviews, receive feedback, and track performance</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Observer</h3>
              <p className="text-blue-200 text-sm">Monitor interviews, review recordings, and provide insights</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Recruitment?</h2>
          <p className="text-blue-200 mb-8 max-w-2xl mx-auto">
            Join the future of AI-powered interviews with advanced evaluation, immersive experiences, and enterprise-grade security.
          </p>
          <Link 
            to="/dashboard" 
            className="inline-flex items-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-xl"
          >
            Explore Platform
            <Shield className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-md border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="w-6 h-6 text-white" />
              <span className="text-white font-semibold">DRDO AI Interview Platform</span>
            </div>
            <p className="text-blue-200 text-sm">
              © 2024 Defence Research and Development Organisation. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}