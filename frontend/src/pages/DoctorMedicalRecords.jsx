import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FileText,
  Plus,
  Search,
  User,
  Calendar,
  Stethoscope,
  Pill,
  Activity,
  X,
  Save,
  Eye,
  CheckCircle,
  Filter,
  Download,
  MoreVertical,
  Heart,
  Thermometer,
  Scale,
  Ruler,
  Clock,
  AlertCircle,
  ChevronDown,
  FileDown,
  Printer,
  Share2,
  Edit,
  Trash2,
} from "lucide-react";
import { medicalRecordsAPI, appointmentsAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const DoctorMedicalRecords = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);
  const [formData, setFormData] = useState({
    patientId: "",
    appointmentId: "",
    recordType: "consultation",
    diagnosis: { mainProblem: "", symptoms: "", notes: "" },
    treatment: { medications: [], procedures: "", recommendations: "" },
    vitalSigns: {
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      weight: "",
      height: "",
    },
    followUp: { nextAppointment: "", instructions: "", warningSigns: "" },
    doctorNotes: "",
    patientComplaints: "",
  });
  const [currentMedication, setCurrentMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });
  const [showMoreOptions, setShowMoreOptions] = useState(null);

  // Fetch medical records
  const {
    data: medicalRecordsData,
    isLoading,
    error,
  } = useQuery("doctor-medical-records", () => medicalRecordsAPI.getAll());

  // Fetch completed appointments
  const { data: appointmentsData } = useQuery(
    "completed-appointments",
    () => appointmentsAPI.getAll(),
    {
      enabled: showCreateModal,
      select: (data) => {
        const appointments =
          data?.data?.data?.appointments || data?.data?.appointments || [];
        return appointments.filter((apt) => apt.status === "completed");
      },
    }
  );

  // Handle navigation state from DoctorAppointments page
  useEffect(() => {
    if (location.state?.appointmentId && location.state?.patientId) {
      setShowCreateModal(true);
      setFormData((prev) => ({
        ...prev,
        appointmentId: location.state.appointmentId,
        patientId: location.state.patientId,
      }));
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Create medical record mutation
  const createRecordMutation = useMutation(
    (recordData) => medicalRecordsAPI.create(recordData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("doctor-medical-records");
        toast.success("Medical record created successfully");
        setShowCreateModal(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to create medical record"
        );
      },
    }
  );

  const medicalRecords =
    medicalRecordsData?.data?.data?.medicalRecords ||
    medicalRecordsData?.data?.medicalRecords ||
    [];

  const filteredRecords = medicalRecords.filter((record) => {
    const matchesSearch =
      record.patientId?.firstName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      record.patientId?.lastName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      record.diagnosis?.mainProblem
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || record.recordType === typeFilter;
    const matchesStatus = !statusFilter || record.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      patientId: "",
      appointmentId: "",
      recordType: "consultation",
      diagnosis: { mainProblem: "", symptoms: "", notes: "" },
      treatment: { medications: [], procedures: "", recommendations: "" },
      vitalSigns: {
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        weight: "",
        height: "",
      },
      followUp: { nextAppointment: "", instructions: "", warningSigns: "" },
      doctorNotes: "",
      patientComplaints: "",
    });
    setCurrentMedication({
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    });
  };

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleAddMedication = () => {
    if (currentMedication.name && currentMedication.dosage) {
      setFormData((prev) => ({
        ...prev,
        treatment: {
          ...prev.treatment,
          medications: [...prev.treatment.medications, currentMedication],
        },
      }));
      setCurrentMedication({
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      });
      toast.success("Medication added");
    } else {
      toast.error("Please fill in medication name and dosage");
    }
  };

  const handleRemoveMedication = (index) => {
    setFormData((prev) => ({
      ...prev,
      treatment: {
        ...prev.treatment,
        medications: prev.treatment.medications.filter((_, i) => i !== index),
      },
    }));
    toast.success("Medication removed");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.patientId || !formData.recordType) {
      toast.error("Please select a patient and record type");
      return;
    }

    const submitData = {
      ...formData,
      diagnosis: {
        ...formData.diagnosis,
        symptoms: formData.diagnosis.symptoms
          ? formData.diagnosis.symptoms.split(",").map((s) => s.trim())
          : [],
      },
      treatment: {
        ...formData.treatment,
        procedures: formData.treatment.procedures
          ? formData.treatment.procedures.split(",").map((s) => s.trim())
          : [],
        recommendations: formData.treatment.recommendations
          ? formData.treatment.recommendations.split(",").map((s) => s.trim())
          : [],
      },
      followUp: {
        ...formData.followUp,
        warningSigns: formData.followUp.warningSigns
          ? formData.followUp.warningSigns.split(",").map((s) => s.trim())
          : [],
      },
    };

    createRecordMutation.mutate(submitData);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRecordTypeColor = (type) => {
    const colors = {
      consultation: "blue",
      diagnosis: "orange",
      treatment: "green",
      follow_up: "purple",
    };
    return colors[type] || "gray";
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "green",
      completed: "blue",
      pending: "orange",
      cancelled: "red",
    };
    return colors[status] || "gray";
  };

  const handleDownloadRecord = (record) => {
    // Simulate download functionality
    toast.success(
      `Downloading record for ${record.patientId?.firstName} ${record.patientId?.lastName}`
    );
    // In a real app, you would generate and download a PDF here
  };

  const handlePrintRecord = (record) => {
    // Simulate print functionality
    toast.success(
      `Printing record for ${record.patientId?.firstName} ${record.patientId?.lastName}`
    );
    // In a real app, you would open print dialog
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-800 mb-2">
            Error Loading Records
          </h3>
          <p className="text-red-600 mb-6">
            {error.response?.data?.message || "Failed to load medical records."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Medical Records
                </h1>
                <p className="text-gray-600 mt-1">
                  Create and manage patient medical records
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn flex items-center space-x-2 transition-all duration-200 ${
                  showFilters
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : "btn-outline hover:bg-blue-50"
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="relative inline-flex items-center justify-center px-5 py-2.5 overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:from-blue-500 hover:to-indigo-500 active:scale-95"
              >
                <span className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-10 transition-opacity duration-300 rounded-full"></span>
                <Plus className="h-5 w-5 mr-2" />
                <span>New Record</span>
              </button>
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name, diagnosis, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-12 pr-4 py-3 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Record Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="form-select rounded-xl w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">All Types</option>
                    <option value="consultation">Consultation</option>
                    <option value="diagnosis">Diagnosis</option>
                    <option value="treatment">Treatment</option>
                    <option value="follow_up">Follow-up</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-select rounded-xl w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Records
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {medicalRecords.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Consultations
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {
                    medicalRecords.filter(
                      (r) => r.recordType === "consultation"
                    ).length
                  }
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-900">
                  {
                    medicalRecords.filter((r) => {
                      const recordDate = new Date(r.createdAt);
                      const now = new Date();
                      return (
                        recordDate.getMonth() === now.getMonth() &&
                        recordDate.getFullYear() === now.getFullYear()
                      );
                    }).length
                  }
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {
                    medicalRecords.filter((r) => r.status === "completed")
                      .length
                  }
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-blue-50">
            <h2 className="text-xl font-bold text-gray-900">Patient Records</h2>
            <span className="text-sm font-medium text-gray-700 bg-white px-3 py-1.5 rounded-full border border-gray-300 shadow-sm">
              {filteredRecords.length} records found
            </span>
          </div>

          {filteredRecords.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <div
                  key={record._id}
                  className="p-6 hover:bg-blue-50/30 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div
                        className={`h-16 w-16 rounded-2xl bg-gradient-to-br from-${getRecordTypeColor(
                          record.recordType
                        )}-500 to-${getRecordTypeColor(
                          record.recordType
                        )}-600 flex items-center justify-center shadow-lg`}
                      >
                        <FileText className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900 truncate">
                            {record.patientId?.firstName}{" "}
                            {record.patientId?.lastName}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-${getRecordTypeColor(
                                record.recordType
                              )}-100 text-${getRecordTypeColor(
                                record.recordType
                              )}-800 border border-${getRecordTypeColor(
                                record.recordType
                              )}-200 capitalize`}
                            >
                              {record.recordType?.replace("_", " ")}
                            </span>
                            {record.status && (
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-${getStatusColor(
                                  record.status
                                )}-100 text-${getStatusColor(
                                  record.status
                                )}-800 border border-${getStatusColor(
                                  record.status
                                )}-200 capitalize`}
                              >
                                {record.status}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                            {formatDate(record.createdAt)}
                          </div>
                          {record.diagnosis?.mainProblem && (
                            <div className="flex items-center text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200">
                              <Stethoscope className="h-4 w-4 mr-2 text-orange-500" />
                              <span className="truncate">
                                {record.diagnosis.mainProblem}
                              </span>
                            </div>
                          )}
                          {record.vitalSigns && (
                            <div className="flex items-center space-x-4 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200">
                              {record.vitalSigns.bloodPressure && (
                                <span className="flex items-center">
                                  <Activity className="h-4 w-4 mr-1 text-green-500" />
                                  {record.vitalSigns.bloodPressure}
                                </span>
                              )}
                              {record.vitalSigns.heartRate && (
                                <span className="flex items-center">
                                  <Heart className="h-4 w-4 mr-1 text-red-500" />
                                  {record.vitalSigns.heartRate} bpm
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {record.doctorNotes && (
                          <p className="text-sm text-gray-600 line-clamp-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            {record.doctorNotes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          setActiveRecord(
                            activeRecord?._id === record._id ? null : record
                          )
                        }
                        className="btn btn-outline btn-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadRecord(record)}
                        className="btn btn-outline btn-sm hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all duration-200"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowMoreOptions(
                              showMoreOptions === record._id ? null : record._id
                            )
                          }
                          className="btn btn-outline btn-sm hover:bg-gray-50 hover:text-gray-600 hover:border-gray-200 transition-all duration-200"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {showMoreOptions === record._id && (
                          <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10 min-w-[160px]">
                            <button
                              onClick={() => handlePrintRecord(record)}
                              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                            >
                              <Printer className="h-4 w-4" />
                              <span>Print</span>
                            </button>
                            <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-150">
                              <Share2 className="h-4 w-4" />
                              <span>Share</span>
                            </button>
                            <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors duration-150">
                              <Edit className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150">
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded View */}
                  {activeRecord?._id === record._id && (
                    <div className="mt-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Diagnosis Details */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                            <Stethoscope className="h-5 w-5 mr-2 text-orange-500" />
                            Diagnosis Details
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="font-semibold text-gray-700">
                                Main Problem:
                              </span>
                              <p className="text-gray-600 mt-1">
                                {record.diagnosis?.mainProblem || "N/A"}
                              </p>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700">
                                Symptoms:
                              </span>
                              <p className="text-gray-600 mt-1">
                                {record.diagnosis?.symptoms?.join(", ") ||
                                  "N/A"}
                              </p>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700">
                                Notes:
                              </span>
                              <p className="text-gray-600 mt-1">
                                {record.diagnosis?.notes || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Treatment Details */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                            <Pill className="h-5 w-5 mr-2 text-green-500" />
                            Treatment Plan
                          </h4>
                          <div className="space-y-4 text-sm">
                            {record.treatment?.medications?.length > 0 ? (
                              <div>
                                <p className="font-semibold text-gray-700 mb-2">
                                  Medications:
                                </p>
                                {record.treatment.medications.map(
                                  (med, idx) => (
                                    <div
                                      key={idx}
                                      className="ml-2 text-gray-600 bg-green-50 px-3 py-2 rounded-lg mb-2 border border-green-100"
                                    >
                                      <div className="font-medium text-gray-900">
                                        {med.name}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {med.dosage} • {med.frequency} •{" "}
                                        {med.duration}
                                        {med.instructions &&
                                          ` • ${med.instructions}`}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500">
                                No medications prescribed
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Doctor Notes - Full Width */}
                      {record.doctorNotes && (
                        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                            <FileText className="h-5 w-5 mr-2 text-blue-500" />
                            Doctor's Notes
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {record.doctorNotes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {searchTerm || typeFilter || statusFilter
                  ? "No matching records found"
                  : "No medical records yet"}
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
                {searchTerm || typeFilter || statusFilter
                  ? "Try adjusting your search criteria or filters to find what you're looking for."
                  : "Start by creating your first medical record for a patient."}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create New Record
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Create Record Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center p-8 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-3xl">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Create Medical Record
                </h2>
                <p className="text-lg text-gray-600 mt-2">
                  Fill in the patient's comprehensive medical information
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 bg-gray-100 hover:bg-gray-200 p-2 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Patient Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    Select Appointment *
                  </label>
                  <select
                    value={formData.appointmentId}
                    onChange={(e) => {
                      const apt = appointmentsData?.find(
                        (a) => a._id === e.target.value
                      );
                      setFormData((prev) => ({
                        ...prev,
                        appointmentId: e.target.value,
                        patientId: apt?.patientId?._id || apt?.patientId || "",
                        patientComplaints: apt?.reason || "",
                      }));
                    }}
                    required
                    className="form-select rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 py-3 text-lg"
                  >
                    <option value="">Select an appointment...</option>
                    {appointmentsData?.map((apt) => (
                      <option key={apt._id} value={apt._id}>
                        {apt.patientName} - {formatDate(apt.appointmentDate)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    Record Type *
                  </label>
                  <select
                    value={formData.recordType}
                    onChange={(e) =>
                      handleInputChange(null, "recordType", e.target.value)
                    }
                    required
                    className="form-select rounded-xl border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 py-3 text-lg"
                  >
                    <option value="consultation">Consultation</option>
                    <option value="diagnosis">Diagnosis</option>
                    <option value="treatment">Treatment</option>
                    <option value="follow_up">Follow-up</option>
                  </select>
                </div>
              </div>

              {/* Vital Signs */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Activity className="h-7 w-7 mr-3 text-blue-600" />
                  Vital Signs
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Activity className="h-4 w-4 mr-1 text-blue-500" />
                      Blood Pressure
                    </label>
                    <input
                      type="text"
                      value={formData.vitalSigns.bloodPressure}
                      onChange={(e) =>
                        handleInputChange(
                          "vitalSigns",
                          "bloodPressure",
                          e.target.value
                        )
                      }
                      placeholder="120/80"
                      className="form-input rounded-lg text-lg border-0 focus:ring-2 focus:ring-blue-200 bg-gray-50"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Heart className="h-4 w-4 mr-1 text-red-500" />
                      Heart Rate
                    </label>
                    <input
                      type="number"
                      value={formData.vitalSigns.heartRate}
                      onChange={(e) =>
                        handleInputChange(
                          "vitalSigns",
                          "heartRate",
                          e.target.value
                        )
                      }
                      placeholder="72"
                      className="form-input rounded-lg text-lg border-0 focus:ring-2 focus:ring-red-200 bg-gray-50"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Thermometer className="h-4 w-4 mr-1 text-orange-500" />
                      Temperature
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vitalSigns.temperature}
                      onChange={(e) =>
                        handleInputChange(
                          "vitalSigns",
                          "temperature",
                          e.target.value
                        )
                      }
                      placeholder="98.6"
                      className="form-input rounded-lg text-lg border-0 focus:ring-2 focus:ring-orange-200 bg-gray-50"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Scale className="h-4 w-4 mr-1 text-green-500" />
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vitalSigns.weight}
                      onChange={(e) =>
                        handleInputChange(
                          "vitalSigns",
                          "weight",
                          e.target.value
                        )
                      }
                      placeholder="70"
                      className="form-input rounded-lg text-lg border-0 focus:ring-2 focus:ring-green-200 bg-gray-50"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Ruler className="h-4 w-4 mr-1 text-purple-500" />
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vitalSigns.height}
                      onChange={(e) =>
                        handleInputChange(
                          "vitalSigns",
                          "height",
                          e.target.value
                        )
                      }
                      placeholder="175"
                      className="form-input rounded-lg text-lg border-0 focus:ring-2 focus:ring-purple-200 bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Stethoscope className="h-7 w-7 mr-3 text-orange-600" />
                  Diagnosis
                </h3>
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-lg font-semibold text-gray-700 mb-3">
                      Main Problem
                    </label>
                    <input
                      type="text"
                      value={formData.diagnosis.mainProblem}
                      onChange={(e) =>
                        handleInputChange(
                          "diagnosis",
                          "mainProblem",
                          e.target.value
                        )
                      }
                      placeholder="Primary diagnosis or main concern"
                      className="form-input rounded-lg text-lg border-0 focus:ring-2 focus:ring-orange-200 bg-gray-50 py-3"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-lg font-semibold text-gray-700 mb-3">
                      Symptoms
                    </label>
                    <input
                      type="text"
                      value={formData.diagnosis.symptoms}
                      onChange={(e) =>
                        handleInputChange(
                          "diagnosis",
                          "symptoms",
                          e.target.value
                        )
                      }
                      placeholder="Fever, headache, cough (comma-separated)"
                      className="form-input rounded-lg text-lg border-0 focus:ring-2 focus:ring-orange-200 bg-gray-50 py-3"
                    />
                  </div>

                  {/* Diagnosis Notes - Full Width */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-lg font-semibold text-gray-700 mb-4">
                      Diagnosis Notes
                    </label>
                    <textarea
                      value={formData.diagnosis.notes}
                      onChange={(e) =>
                        handleInputChange("diagnosis", "notes", e.target.value)
                      }
                      rows={6}
                      placeholder="Detailed clinical observations, examination findings, diagnostic reasoning, differential diagnosis, and any relevant medical history..."
                      className="form-textarea rounded-xl text-lg border-0 focus:ring-2 focus:ring-orange-200 bg-gray-50 py-4 w-full resize-vertical"
                    />
                    <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                      <span>Add comprehensive clinical notes</span>
                      <span>
                        {formData.diagnosis.notes.length}/2000 characters
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medications */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Pill className="h-7 w-7 mr-3 text-green-600" />
                  Medications
                </h3>
                {formData.treatment.medications.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-xl font-semibold text-gray-700 mb-4">
                      Current Medications
                    </h4>
                    <div className="space-y-4">
                      {formData.treatment.medications.map((med, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-white border-2 border-green-200 rounded-xl p-5 shadow-sm"
                        >
                          <div className="flex-1">
                            <p className="text-lg font-bold text-gray-900">
                              {med.name}
                            </p>
                            <p className="text-base text-gray-600 mt-1">
                              {med.dosage} • {med.frequency} • {med.duration}
                              {med.instructions && ` • ${med.instructions}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors duration-200 ml-4"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl p-6 border-2 border-green-300 shadow-sm">
                  <h4 className="text-xl font-semibold text-gray-700 mb-4">
                    Add New Medication
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medication Name
                      </label>
                      <input
                        type="text"
                        value={currentMedication.name}
                        onChange={(e) =>
                          setCurrentMedication((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Medication name"
                        className="form-input rounded-lg border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dosage
                      </label>
                      <input
                        type="text"
                        value={currentMedication.dosage}
                        onChange={(e) =>
                          setCurrentMedication((prev) => ({
                            ...prev,
                            dosage: e.target.value,
                          }))
                        }
                        placeholder="Dosage (e.g., 500mg)"
                        className="form-input rounded-lg border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency
                      </label>
                      <input
                        type="text"
                        value={currentMedication.frequency}
                        onChange={(e) =>
                          setCurrentMedication((prev) => ({
                            ...prev,
                            frequency: e.target.value,
                          }))
                        }
                        placeholder="Frequency (e.g., Twice daily)"
                        className="form-input rounded-lg border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={currentMedication.duration}
                        onChange={(e) =>
                          setCurrentMedication((prev) => ({
                            ...prev,
                            duration: e.target.value,
                          }))
                        }
                        placeholder="Duration (e.g., 7 days)"
                        className="form-input rounded-lg border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 py-2.5"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions
                    </label>
                    <input
                      type="text"
                      value={currentMedication.instructions}
                      onChange={(e) =>
                        setCurrentMedication((prev) => ({
                          ...prev,
                          instructions: e.target.value,
                        }))
                      }
                      placeholder="Special instructions"
                      className="form-input rounded-lg border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 py-2.5 w-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="btn bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2.5 px-6 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Medication
                  </button>
                </div>
              </div>

              {/* Doctor Notes - Full Width */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-200">
                <div className="flex items-center justify-between mb-6">
                  <label className="block text-2xl font-bold text-gray-700">
                    Doctor's Comprehensive Notes
                  </label>
                  <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-300">
                    {formData.doctorNotes.length}/5000 characters
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-1 border border-gray-200 shadow-sm">
                  <textarea
                    value={formData.doctorNotes}
                    onChange={(e) =>
                      handleInputChange(null, "doctorNotes", e.target.value)
                    }
                    rows={12}
                    placeholder="Enter comprehensive clinical observations, treatment rationale, patient progress, follow-up recommendations, and any additional medical notes...

• Clinical findings and examination results
• Treatment plan and rationale
• Patient response to treatment
• Follow-up instructions and recommendations
• Any other relevant medical information..."
                    className="form-textarea rounded-2xl text-lg border-0 focus:ring-2 focus:ring-purple-200 bg-white py-6 px-6 w-full resize-vertical leading-relaxed"
                  />
                </div>
                <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      Detailed medical documentation
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Auto-saved as you type
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange(null, "doctorNotes", "")}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors duration-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="btn btn-outline px-8 py-3 text-lg font-semibold rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRecordMutation.isLoading}
                  className="btn bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createRecordMutation.isLoading ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-3">Creating Record...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-3" />
                      Create Medical Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorMedicalRecords;
