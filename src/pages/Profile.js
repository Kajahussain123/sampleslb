import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { Container, Row, Col, ProgressBar, Button } from "react-bootstrap";
import {
  getProfile,
  updateProfile,
  updateProfileImage,
  toggleDutyStatus,
  getViewMainTrainings,
  getOverallTrainingOTC,
  fetchNotifications
} from "../services/allApi";
import Header from "../components/Header";
import CCT from "../components/CCT";
import CIT from "../components/CIT";
import EXT from "../components/EXT";
import SLBAT from "../components/SLBAT";
import SLBCT from "../components/SLBCT";
import { BASE_URL } from "../services/baseUrl";
import Swal from "sweetalert2";
function Profile() {
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userid");
  const progressPercentage = 88;
  const [selectedHeading, setSelectedHeading] = useState("External Training");
  const [showContent, setShowContent] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [companyOptions, setCompanyOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [formValues, setFormValues] = useState({
    fullname: "",
    designation: "",
    gatePassNo: "",
    project: { id: "", name: "" },
    rig: "",
    company: { id: "", name: "" },
    profile_photo: "https://i.postimg.cc/fb2QkK8K/307ce493-b254-4b2d-8ba4-d12c080d6651.jpg",
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [onDuty, setOnDuty] = useState(false);
  const [trainingOptions, setTrainingOptions] = useState([]);
  const [overallTrainingOTC, setOverallTrainingOTC] = useState(0);
  const [fetchError, setFetchError] = useState(false); // State for handling errors
  useEffect(() => {
    if (!userId) {
      navigate("/");
    } else {
      const fetchData = async () => {
        try {
          const profileResult = await getProfile(userId);
          if (!profileResult || !profileResult.fullname) {
            setFetchError(true);
            return;
          }
          setProfileData(profileResult);
          setFormValues({
            fullname: profileResult.fullname,
            designation: profileResult.designation,
            gatePassNo: profileResult.gate_pass_no,
            project: profileResult.project || { id: "", name: "" },
            rig: profileResult.rig_or_rigless,
            company: profileResult.company || { id: "", name: "" },
            profile_photo: profileResult.profile_photo || formValues.profile_photo,
          });
          setOnDuty(profileResult.on_duty);
          const response = await fetch(`${BASE_URL}/api/viewcompanies/`);
          const data = await response.json();
          setCompanyOptions(data);
          const trainingsResponse = await getViewMainTrainings();
          setTrainingOptions(trainingsResponse);
          const otcResponse = await getOverallTrainingOTC(userId);
          setOverallTrainingOTC(otcResponse.average_completion_percentage);
          console.log(otcResponse);
          const projectsResponse = await fetch(`${BASE_URL}/api/viewprojects/`);
          const projectsData = await projectsResponse.json();
          setProjectOptions(projectsData);
        } catch (error) {
          console.error("Error fetching data:", error);
          setFetchError(true);
        }
      };
      fetchData();
    }
  }, [userId, navigate, formValues.profile_photo]);
  const handleDutyToggle = async () => {
    try {
      const response = await toggleDutyStatus(userId, !onDuty);
      setOnDuty(response.on_duty);
      console.log(response);
    } catch (error) {
      console.error("Error toggling duty status:", error);
    }
  };



  // Notification count
const [notificationCount, setNotificationCount] = useState(0);
useEffect(() => {
  getNotificationCount();
}, []);
const getNotificationCount = async () => {
  try {
    const notifications = await fetchNotifications();
    setNotificationCount(notifications.length);
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
};
  const handleEditClick = async () => {
    if (isEditMode) {
      try {
        const updatedData = {
          fullname: formValues.fullname || profileData.fullname,
          designation: formValues.designation || profileData.designation,
          gate_pass_no: formValues.gatePassNo || profileData.gate_pass_no,
          project_id: formValues.project.id || profileData.project.id,
          rig_or_rigless: formValues.rig || profileData.rig_or_rigless,
          company_id: formValues.company.id || profileData.company.id,
          mobile_number: profileData.mobile_number,
        };
        const result = await updateProfile(profileData.id, updatedData);
        console.log(result);
        if (profileImageFile) {
          const formData = new FormData();
          formData.append("profileImage", profileImageFile);
          const imageResult = await updateProfileImage(profileData.id, formData);
          console.log(imageResult);
        }
        Swal.fire({
          icon: 'success',
          title: 'Profile Updated Successfully',
          showConfirmButton: false,
          timer: 1500
        });
        window.location.reload();
      } catch (error) {
        console.error("Error updating profile:", error);
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Failed to update profile',
        });
      }
    }
    setIsEditMode(!isEditMode);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "project") {
      const selectedProject = projectOptions.find(project => project.id === parseInt(value));
      setFormValues({ ...formValues, project: selectedProject });
    } else if (name === "company") {
      const selectedCompany = companyOptions.find(company => company.id === parseInt(value));
      setFormValues({ ...formValues, company: selectedCompany });
    } else {
      setFormValues({ ...formValues, [name]: value });
    }
  };
  const handleHeadingClick = (heading) => {
    setSelectedHeading(heading);
    setShowContent(true);
  };
  const renderContentComponent = () => {
    switch (selectedHeading) {
      case "External Training":
        return <EXT />;
      case "Cairn Certified Training":
        return <CCT />;
      case "Cairn Introduction Training":
        return <CIT />;
      case "SLB Certified Training":
        return <SLBCT />;
      case "SLB Awarness Training(PRM)":
        return <SLBAT />;
      default:
        return null;
    }
  };
  const handleImageChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile || !selectedFile.type.match('image/*')) {
      return alert('Please select a valid image file.');
    }
    const id = sessionStorage.getItem("userid");
    const formData = new FormData();
    formData.append('profile_photo', selectedFile);
    setFormValues({ ...formValues, profile_photo: selectedFile });
    updateProfileImage(id, formData)
      .then((updatedProfile) => {
        setFormValues({ ...formValues, profile_photo: updatedProfile.profile_photoUrl });
        Swal.fire({
          icon: 'success',
          title: 'Profile Photo Updated Successfully',
          showConfirmButton: false,
          timer: 1500
        });
        window.location.reload();
      })
      .catch((error) => {
        console.error('Error updating profile image:', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Failed to update profile photo',
        });
      });
  };
  if (  !profileData || !profileData.fullname) {
    return (
      <div>
        <Header />
        <div className="error-message">
          <h2>Invalid Data</h2>
          <p>Unable to load profile information. Please try again later.</p>
        </div>
      </div>
    );
  }



  return (
    <div>
      <Header notificationCount={notificationCount} />
      <div className="profile-wrapper mt-3">
        <Container fluid>
          <Row className="profile-container">
            <Col sm={3} className="menu" style={{ marginLeft: "3%" }}>
              <div className="profile-info">
                <div className="profile-image">
                  <label className="switch">
                    <input
                      type="checkbox"
                      onChange={handleDutyToggle}
                      checked={onDuty}
                    />
                    <span className="slider"></span>
                  </label>
                  <div>
                    <img
                      src={formValues.profile_photo}
                      alt="Profile"
                      onClick={() => {
                        document.getElementById('profileImageInput').click();
                      }}
                      />
                      <input
                        type="file"
                        id="profileImageInput"
                        accept="image/*"
                        onChange={handleImageChange}
                        hidden
                      />
                    </div>
                  </div>
                  <div className="profile-details">
                    {isEditMode ? (
                      <>
                        <input
                          style={{
                            border: "none",
                            textAlign: "center",
                            width: "100%",
                          }}
                          type="text"
                          name="fullname"
                          id="name"
                          value={formValues.fullname}
                          onChange={handleInputChange}
                        />
                        <input
                          style={{
                            border: "none",
                            textAlign: "center",
                            width: "100%",
                          }}
                          type="text"
                          name="designation"
                          id="job"
                          value={formValues.designation}
                          onChange={handleInputChange}
                        />
                      </>
                    ) : (
                      <>
                        <p id="name">{profileData.fullname}</p>
                        <p id="job">{profileData.designation}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="progress-container">
                  <p id="otc">Overall training (OTC)</p>
                  <ProgressBar
                    style={{ height: "13px" }}
                    now={overallTrainingOTC}
                    label={`${overallTrainingOTC}%`}
                    variant={overallTrainingOTC < 95 ? "danger" : "success"}
                  />
                </div>
                <p className="form-heading">Training records</p>
                <form className="training-form">
                  <div className="form-row">
                    <div className="form-col-left">Gate Pass No.</div>
                    <div className="form-col-right">
                      {isEditMode ? (
                        <input
                          style={{ border: "none", textAlign: "end" }}
                          type="text"
                          name="gatePassNo"
                          value={formValues.gatePassNo}
                          onChange={handleInputChange}
                        />
                      ) : (
                        formValues.gatePassNo
                      )}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-col-left">Project</div>
                    <div className="form-col-right">
                      {isEditMode ? (
                        <select
                          style={{ border: "none", textAlign: "end" }}
                          name="project"
                          value={formValues.project.id}
                          onChange={handleInputChange}
                        >
                          {projectOptions.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        formValues.project.name
                      )}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-col-left">Rig/Rigless</div>
                    <div className="form-col-right">
                      {isEditMode ? (
                        <select
                          style={{ border: "none", textAlign: "end" }}
                          name="rig"
                          value={formValues.rig}
                          onChange={handleInputChange}
                        >
                          <option value="">Select</option>
                          <option value="Rig">Rig</option>
                          <option value="Rigless">Rigless</option>
                        </select>
                      ) : (
                        formValues.rig
                      )}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-col-left">Company</div>
                    <div className="form-col-right">
                      {isEditMode ? (
                        <select
                          style={{ border: "none", textAlign: "end" }}
                          name="company"
                          value={formValues.company.id}
                          onChange={handleInputChange}
                        >
                          {companyOptions.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        formValues.company.name
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleEditClick}
                    style={{
                      marginLeft: "73%",
                      border: "none",
                      backgroundColor: "#E6E6E6",
                      width: "26%",
                      height: "35px",
                      color: "black",
                    }}
                  >
                    {isEditMode ? "Save" : "Edit"}
                  </Button>
                </form>
              </Col>
              <Col sm={8} className="content" style={{ marginLeft: "2%" }}>
                <div className="heading-section">
                  <div className="heading-list">
                    {trainingOptions.map((training) => (
                      <div
                        key={training.id}
                        className={
                          selectedHeading === training.name
                            ? "heading selected"
                            : "heading"
                        }
                        onClick={() => handleHeadingClick(training.name)}
                      >
                        {training.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="content-section">
                  {showContent && renderContentComponent()}
                </div>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
    );
  }
  export default Profile;