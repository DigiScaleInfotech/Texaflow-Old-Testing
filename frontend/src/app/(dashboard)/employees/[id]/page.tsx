'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  DollarSign, 
  Edit, 
  Trash2, 
  FileText, 
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  User,
  BookOpen,
  Award,
  Bookmark,
  Star,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Employee } from '@/types';
import Image from 'next/image';

// Component for employee status badge
const EmployeeStatusBadge = ({ status }: { status: string }) => {
  const getStatusDetails = (status: string) => {
    switch(status) {
      case 'active':
        return {
          bgColor: 'bg-green-100 dark:bg-green-500/10',
          textColor: 'text-green-600 dark:text-green-400',
          icon: <CheckCircle size={14} />
        };
      case 'on-leave':
        return {
          bgColor: 'bg-yellow-100 dark:bg-yellow-500/10',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          icon: <Clock size={14} />
        };
      case 'inactive':
        return {
          bgColor: 'bg-red-100 dark:bg-red-500/10',
          textColor: 'text-red-600 dark:text-red-400',
          icon: <XCircle size={14} />
        };
      default:
        return {
          bgColor: 'bg-gray-100 dark:bg-gray-700/50',
          textColor: 'text-gray-600 dark:text-gray-400',
          icon: null
        };
    }
  };

  const { bgColor, textColor, icon } = getStatusDetails(status);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      <span className="capitalize">{status}</span>
    </span>
  );
};

export default function EmployeeDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState(false);
  const [showFullAttendance, setShowFullAttendance] = useState(false);
  const [showFullSalaryHistory, setShowFullSalaryHistory] = useState(false);

  // Function to get profile image - defaults to clean neutral avatar
  const getProfileImage = (gender?: string) => {
    return (employee as any)?.image || '/default-avatar.svg';
  };

  // Add click outside handler to close the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeActionMenu && !target.closest('.action-menu-container')) {
        setActiveActionMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeActionMenu]);

  useEffect(() => {
    // Mock data - replace with actual API call
    setEmployee({
      id: params.id,
      name: 'John Doe',
      mobile: '+91 9876543210',
      role: 'Production Manager',
      salary: 50000,
      paidSalary: 45000,
      totalSalary: 50000,
      email: 'john.doe@company.com',
      joiningDate: new Date('2023-01-15'),
      department: 'Production',
      address: '123 Work Street, Mumbai, Maharashtra',
      attendance: 95,
      performanceRating: 4.5,
      gender: 'male',
      employeeId: 'EMP001',
      emergencyContact: '+91 9876543211',
      birthDate: '1985-05-15',
      education: 'Bachelor of Textile Engineering',
      skills: ['Production Planning', 'Quality Control', 'Team Management', 'ERP Systems'],
      attendanceHistory: [
        { date: '2024-01-15', status: 'present' },
        { date: '2024-01-16', status: 'present' },
        { date: '2024-01-17', status: 'present' },
        { date: '2024-01-18', status: 'late' },
        { date: '2024-01-19', status: 'present' },
        { date: '2024-01-20', status: 'leave' },
        { date: '2024-01-21', status: 'present' },
        { date: '2024-01-22', status: 'absent' },
      ],
      performanceHistory: [
        { period: 'Q4 2023', rating: 4.5, feedback: 'Excellent leadership in production optimization.' },
        { period: 'Q3 2023', rating: 4.2, feedback: 'Good performance in managing team during peak season.' },
        { period: 'Q2 2023', rating: 4.0, feedback: 'Met all production targets, needs improvement in documentation.' }
      ],
      salaryHistory: [
        { month: 'January 2024', amount: 50000, status: 'paid', date: '2024-01-01' },
        { month: 'December 2023', amount: 50000, status: 'paid', date: '2023-12-01' },
        { month: 'November 2023', amount: 50000, status: 'paid', date: '2023-11-01' },
        { month: 'October 2023', amount: 50000, status: 'paid', date: '2023-10-01' },
        { month: 'September 2023', amount: 50000, status: 'paid', date: '2023-09-01' },
        { month: 'August 2023', amount: 50000, status: 'pending', date: '2023-08-01' },
      ]
    });
  }, [params.id]);

  if (!employee) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/employees" 
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{employee.name}</h1>
            <p className="text-sm text-gray-500">
              ID: {employee.employeeId ?? employee.id} • Joined: {employee.joiningDate?.toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group action-menu-container">
            <button 
              onClick={() => setActiveActionMenu(!activeActionMenu)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronDown size={16} />
              Actions
            </button>
            {activeActionMenu && (
              <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button 
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" 
                    role="menuitem"
                  >
                    <FileText size={14} className="mr-3" />
                    Pay Salary
                  </button>
                  <button 
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" 
                    role="menuitem"
                    onClick={() => router.push(`/employees/edit/${employee.id}`)}
                  >
                    <Edit size={14} className="mr-3" />
                    Edit Employee
                  </button>
                  <button 
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700" 
                    role="menuitem"
                  >
                    <Trash2 size={14} className="mr-3" />
                    Remove Employee
                  </button>
                </div>
              </div>
            )}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Mail size={16} />
            Contact
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            <DollarSign size={16} />
            Pay Salary
          </button>
        </div>
      </div>
      
      {/* Employee Info Card */}
      <div className="glass-card rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Basic Info */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center sm:items-start gap-4">
              <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="relative h-full w-full">
                  <Image
                    src={getProfileImage(employee.gender)}
                    alt={employee.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              
              <div className="space-y-4 w-full">
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
                    <EmployeeStatusBadge status="active" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-500 mb-1">Attendance</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.attendance}%</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t dark:border-gray-700 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Department</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.department}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Role</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.role}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Middle - Contact Info */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Contact Information</div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-gray-500" />
                    <a href={`mailto:${employee.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      {employee.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-gray-500" />
                    <a href={`tel:${employee.mobile}`} className="text-sm text-gray-700 dark:text-gray-300">
                      {employee.mobile}
                    </a>
                  </div>
                  {employee.emergencyContact && (
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-gray-500" />
                      <a href={`tel:${employee.emergencyContact}`} className="text-sm text-gray-700 dark:text-gray-300">
                        {employee.emergencyContact} (Emergency)
                      </a>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-gray-500 mt-0.5" />
                    <address className="not-italic text-sm text-gray-700 dark:text-gray-300">
                      {employee.address}
                    </address>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t dark:border-gray-700">
                <div className="text-sm font-medium text-gray-500 mb-2">Personal Information</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Birthday</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {employee.birthDate && new Date(employee.birthDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Education</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{employee.education}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Financial & Skills */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Salary Information</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Monthly Salary</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">₹{employee.salary.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Performance</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{employee.performanceRating}/5</div>
                  </div>
                </div>
              </div>
              
              {employee.skills && (
                <div className="pt-4 border-t dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-500 mb-2">Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {employee.skills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="px-2.5 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Attendance History */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Attendance History</h2>
          <button 
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => setShowFullAttendance(!showFullAttendance)}
          >
            {showFullAttendance ? "Show Less" : "View Full History"}
          </button>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {(showFullAttendance 
                ? employee?.attendanceHistory ?? [] 
                : employee?.attendanceHistory?.slice(0, 5) ?? []
              ).map((record, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{record.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                      record.status === 'present' 
                        ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400' 
                        : record.status === 'late'
                        ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                        : record.status === 'leave'
                        ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>{record.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Performance Reviews */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Performance Reviews</h2>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Add Review</button>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {employee.performanceHistory && employee.performanceHistory.map((record, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{record.period}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-700 dark:text-gray-300 mr-2">{record.rating}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            className={i < Math.floor(record.rating) 
                              ? "text-yellow-400 fill-yellow-400" 
                              : i < record.rating 
                                ? "text-yellow-400 fill-yellow-400 opacity-50" 
                                : "text-gray-300 dark:text-gray-600"}
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{record.feedback}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Salary History */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Salary History</h2>
          <button 
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => setShowFullSalaryHistory(!showFullSalaryHistory)}
          >
            {showFullSalaryHistory ? "Show Less" : "View All Transactions"}
          </button>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(showFullSalaryHistory 
                ? employee?.salaryHistory ?? [] 
                : employee?.salaryHistory?.slice(0, 5) ?? []
              ).map((salary, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{salary.month}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{salary.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                      salary.status === 'paid'
                        ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                    }`}>{salary.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">₹{salary.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
