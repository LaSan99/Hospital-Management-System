import React, { useState } from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import {
  UserCheck,
  Search,
  Filter,
  Star,
  Clock,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  BookOpen,
  Activity,
  HeartPulse,
  Shield,
  Users,
  Calendar,
  Award,
  GraduationCap,
  ChevronRight,
  Eye,
  Sparkles,
  BadgeCheck,
  Zap,
  TrendingUp,
  Clock4,
  Stethoscope,
} from "lucide-react";
import { doctorsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

const PatientDoctors = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Fetch doctors data
  const {
    data: doctorsData,
    isLoading,
    error,
  } = useQuery("doctors", () => doctorsAPI.getAll(), {
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const doctors =
    doctorsData?.data?.data?.doctors ||
    doctorsData?.data?.doctors ||
    doctorsData?.data ||
    [];

  // Get unique specializations for filter
  const specializations = [
    ...new Set(doctors.map((doctor) => doctor.specialization).filter(Boolean)),
  ];

  // Quick filters
  const quickFilters = [
    { id: "all", label: "All Doctors", icon: Users, count: doctors.length },
    {
      id: "available",
      label: "Available Now",
      icon: Clock4,
      count: doctors.filter((d) => d.isAvailable).length,
    },
    {
      id: "popular",
      label: "Most Popular",
      icon: TrendingUp,
      count: Math.floor(doctors.length * 0.3),
    },
    {
      id: "experienced",
      label: "Experienced",
      icon: Award,
      count: doctors.filter((d) => d.experience > 10).length,
    },
  ];

  // Filter doctors based on search term and specialization
  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialization =
      !selectedSpecialization ||
      doctor.specialization === selectedSpecialization;

    let matchesQuickFilter = true;
    switch (activeFilter) {
      case "available":
        matchesQuickFilter = doctor.isAvailable;
        break;
      case "popular":
        matchesQuickFilter = Math.random() > 0.7; // Simulate popularity
        break;
      case "experienced":
        matchesQuickFilter = doctor.experience > 10;
        break;
      default:
        matchesQuickFilter = true;
    }

    return matchesSearch && matchesSpecialization && matchesQuickFilter;
  });

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  const formatExperience = (experience) => {
    if (!experience) return "Experience not specified";
    return `${experience} year${experience > 1 ? "s" : ""} experience`;
  };

  const handleBookAppointment = (doctor) => {
    navigate(`/book-appointment?doctorId=${doctor._id}`, {
      state: { doctorId: doctor._id },
    });
  };

  const handleViewProfile = (doctor) => {
    navigate(`/doctor-profile/${doctor._id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Unable to Load Doctors
          </h3>
          <p className="text-gray-600 mb-6">
            {error.response?.data?.message ||
              "Please check your connection and try again."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
  {/* 🔹 Hero Section — full width, no left/right margin */}
  <HeroSection />

  {/* 🔹 Rest of the page (centered) */}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <StatsOverview
      totalDoctors={doctors.length}
      filteredDoctors={filteredDoctors.length}
      specializations={specializations.length}
      availableDoctors={doctors.filter((d) => d.isAvailable).length}
    />

    <QuickFilters
      filters={quickFilters}
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
    />

    <SearchSection
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      selectedSpecialization={selectedSpecialization}
      setSelectedSpecialization={setSelectedSpecialization}
      specializations={specializations}
    />

    <ResultsHeader
      filteredCount={filteredDoctors.length}
      totalCount={doctors.length}
      searchTerm={searchTerm}
    />

    {filteredDoctors.length === 0 ? (
      <NoDoctorsFound
        searchTerm={searchTerm}
        selectedSpecialization={selectedSpecialization}
        onClearFilters={() => {
          setSearchTerm("");
          setSelectedSpecialization("");
          setActiveFilter("all");
        }}
      />
    ) : (
      <DoctorsGrid
        filteredDoctors={filteredDoctors}
        getInitials={getInitials}
        formatExperience={formatExperience}
        handleBookAppointment={handleBookAppointment}
        handleViewProfile={handleViewProfile}
      />
    )}
  </div>
</div>

    </div>
  );
};

// Component Functions
const HeroSection = () => {
  return (
    <div className="relative px-4 py-12 md:py-16 overflow-hidden  bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-2xl mb-8">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative px-8 py-12 md:py-16">
        <div className="max-w-4xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                Find Your Perfect Doctor
              </h1>
              <p className="text-blue-100 text-lg sm:text-xl">
                Expert care from trusted healthcare professionals
              </p>
            </div>
          </div>
          <p className="text-blue-100/90 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
            Connect with board-certified specialists, read patient reviews, and
            book appointments that fit your schedule.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center text-white/90 text-sm">
              <BadgeCheck className="h-5 w-5 mr-2 text-green-300" />
              Verified Credentials
            </div>
            <div className="flex items-center text-white/90 text-sm">
              <Clock className="h-5 w-5 mr-2 text-blue-300" />
              Same-day Appointments
            </div>
            <div className="flex items-center text-white/90 text-sm">
              <Shield className="h-5 w-5 mr-2 text-purple-300" />
              Secure & Private
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/5"></div>
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white/5"></div>
    </div>
  );
};

const StatsOverview = ({
  totalDoctors,
  filteredDoctors,
  specializations,
  availableDoctors,
}) => {
  const stats = [
    {
      icon: Users,
      value: totalDoctors,
      label: "Total Doctors",
      color: "blue",
      trend: "+5 this month",
    },
    {
      icon: Clock4,
      value: availableDoctors,
      label: "Available Now",
      color: "green",
      trend: "Ready to consult",
    },
    {
      icon: Award,
      value: specializations,
      label: "Specializations",
      color: "purple",
      trend: "Expert coverage",
    },
    {
      icon: Sparkles,
      value: "98%",
      label: "Satisfaction Rate",
      color: "orange",
      trend: "Patient rated",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
              </div>
              <div className={`p-3 rounded-xl bg-${stat.color}-50`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const QuickFilters = ({ filters, activeFilter, setActiveFilter }) => {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Filters
      </h3>
      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex items-center px-4 py-3 rounded-xl border transition-all duration-300 ${
              activeFilter === filter.id
                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25"
                : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md"
            }`}
          >
            <filter.icon className="h-4 w-4 mr-2" />
            <span className="font-medium">{filter.label}</span>
            <span
              className={`ml-2 px-2 py-1 rounded-full text-xs ${
                activeFilter === filter.id
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {filter.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const SearchSection = ({
  searchTerm,
  setSearchTerm,
  selectedSpecialization,
  setSelectedSpecialization,
  specializations,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by doctor name, specialization, or condition..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <select
          className="px-4 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-lg"
          value={selectedSpecialization}
          onChange={(e) => setSelectedSpecialization(e.target.value)}
        >
          <option value="">All Specializations</option>
          {specializations.map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>
        <button className="px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center shadow-lg hover:shadow-blue-500/25">
          <Filter className="h-5 w-5 mr-2" />
          Advanced
        </button>
      </div>
    </div>
  );
};

const ResultsHeader = ({ filteredCount, totalCount, searchTerm }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Available Doctors</h2>
        <p className="text-gray-600 mt-1">
          {searchTerm ? (
            <>
              Showing{" "}
              <span className="font-semibold text-blue-600">
                {filteredCount}
              </span>{" "}
              results for your search
            </>
          ) : (
            <>
              Found{" "}
              <span className="font-semibold text-blue-600">
                {filteredCount}
              </span>{" "}
              of <span className="font-semibold">{totalCount}</span> doctors
            </>
          )}
        </p>
      </div>
      <div className="flex items-center space-x-4 mt-4 sm:mt-0">
        <span className="text-sm text-gray-500">Sort by:</span>
        <select className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>Recommended</option>
          <option>Experience</option>
          <option>Rating</option>
          <option>Availability</option>
        </select>
      </div>
    </div>
  );
};

const NoDoctorsFound = ({
  searchTerm,
  selectedSpecialization,
  onClearFilters,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
        <UserCheck className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        No Doctors Found
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto text-lg">
        {searchTerm || selectedSpecialization
          ? "We couldn't find any doctors matching your criteria. Try adjusting your search or filters."
          : "There are currently no doctors available in our system."}
      </p>
      {(searchTerm || selectedSpecialization) && (
        <button
          onClick={onClearFilters}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/25"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
};

const DoctorsGrid = ({
  filteredDoctors,
  getInitials,
  formatExperience,
  handleBookAppointment,
  handleViewProfile,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {filteredDoctors.map((doctor) => (
        <DoctorCard
          key={doctor._id}
          doctor={doctor}
          getInitials={getInitials}
          formatExperience={formatExperience}
          handleBookAppointment={handleBookAppointment}
          handleViewProfile={handleViewProfile}
        />
      ))}
    </div>
  );
};

const DoctorCard = ({
  doctor,
  getInitials,
  formatExperience,
  handleBookAppointment,
  handleViewProfile,
}) => {
  const rating = 4.2 + Math.random() * 0.8; // Simulate rating between 4.2-5.0
  const reviewCount = Math.floor(Math.random() * 200) + 50;

  return (
    <div className="group bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
      {/* Doctor Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 mx-2 text-white relative overflow-hidden">
        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <span className="text-white font-bold text-lg">
              {getInitials(doctor.firstName, doctor.lastName)}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">
              Dr. {doctor.firstName} {doctor.lastName}
            </h3>
            <p className="text-blue-100 font-medium">
              {doctor.specialization || "General Practice"}
            </p>
            <div className="flex items-center mt-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(rating)
                        ? "text-yellow-300 fill-current"
                        : "text-white/40"
                    }`}
                  />
                ))}
              </div>
              <span className="text-blue-100 text-sm ml-2">
                {rating.toFixed(1)} ({reviewCount})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Details */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Award className="h-4 w-4 mr-2 text-blue-500" />
            <span>{formatExperience(doctor.experience)}</span>
          </div>
          {doctor.isAvailable && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Available
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="h-4 w-4 mr-3 text-green-500" />
            <span className="font-medium">
              ${doctor.consultationFee || "Not specified"}
            </span>
            <span className="text-gray-400 ml-1">consultation</span>
          </div>

          {doctor.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-3 text-purple-500" />
              <span>{doctor.phone}</span>
            </div>
          )}

          {doctor.address && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-3 text-red-500" />
              <span className="truncate">
                {doctor.address.city}, {doctor.address.state}
              </span>
            </div>
          )}
        </div>

        {/* Specializations & Services */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {[doctor.specialization, "Consultation", "Follow-ups"].map(
              (tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        <div className="flex space-x-3">
          {/* <button
            onClick={() => handleViewProfile(doctor)}
            className="flex-1 flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            <Eye className="h-4 w-4 mr-2" />
            Profile
          </button> */}
          <button
            onClick={() => handleBookAppointment(doctor)}
            disabled={!doctor.isAvailable}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDoctors;
