// import React, { useState } from "react";
// import "./Profile.css";
// import axios from "axios";
// const Profile = () => {
//   const [formData, setFormData] = useState({
//     aadhaarFront: null,
//     aadhaarBack: null,
//     idFront: null,
//     idBack: null,
//     licenseOrProof: null,
//     address: "",
//   });

//   const handleChange = (e) => {
//     e.preventDefault();
//     const { name, files, value } = e.target;
//     if (name === "address") {
//       setFormData({ ...formData, address: value });
//     } else {
//       setFormData({ ...formData, [name]: files[0] });
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     // TODO: Send formData to server
//     const data = new FormData();
//     for (const key in formData) {
//       data.append(key, formData[key]);
//     }

//     console.log("Form submitted", formData);
//     alert("Documents uploaded successfully!");
//   };

//   return (
//     <div className="profile-container">
//       <h2 className="profile-title">Upload Your Documents</h2>
//       <form onSubmit={handleSubmit} className="profile-form">
//         <div className="form-group">
//           <label>Aadhaar Card (Front)</label>
//           <input
//             type="file"
//             name="aadhaarFront"
//             onChange={handleChange}
//             required
//           />
//         </div>

//         <div className="form-group">
//           <label>Aadhaar Card (Back)</label>
//           <input
//             type="file"
//             name="aadhaarBack"
//             onChange={handleChange}
//             required
//           />
//         </div>

//         <div className="form-group">
//           <label>ID Card (Front)</label>
//           <input type="file" name="idFront" onChange={handleChange} required />
//         </div>

//         <div className="form-group">
//           <label>ID Card (Back)</label>
//           <input type="file" name="idBack" onChange={handleChange} required />
//         </div>

//         <div className="form-group">
//           <label>Driving License or Address Proof</label>
//           <input
//             type="file"
//             name="licenseOrProof"
//             onChange={handleChange}
//             required
//           />
//         </div>

//         <div className="form-group">
//           <label>Your Address</label>
//           <textarea
//             name="address"
//             className="form-control"
//             rows="3"
//             value={formData.address}
//             onChange={handleChange}
//             required
//           ></textarea>
//         </div>

//         <button type="submit" className="btn btn-primary w-100">
//           Submit
//         </button>
//       </form>
//     </div>
//   );
// };

// export default Profile;

import React, { useState } from "react";
import "./Profile.css";
import axios from "axios";

const Profile = () => {
  const [formData, setFormData] = useState({
    aadhaarFront: null,
    aadhaarBack: null,
    idFront: null,
    idBack: null,
    licenseOrProof: null,
    address: "",
  });

  const handleChange = (e) => {
    const { name, files, value } = e.target;

    if (files) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: files[0],
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   const data = new FormData();

  //   // Add user ID or mobile number from local storage (if applicable)
  //   const user = JSON.parse(localStorage.getItem("user")); // Assumes { id, mobile, ... }
  //   if (user && user.id) {
  //     data.append("userId", user.id);
  //   }

  //   for (const key in formData) {
  //     data.append(key, formData[key]);
  //   }

  //   try {
  //     const response = await axios.post(
  //       "http://localhost:5000/upload-documents",
  //       data,
  //       {
  //         headers: {
  //           "Content-Type": "multipart/form-data",
  //         },
  //       }
  //     );

  //     console.log("Upload success:", response.data);
  //     alert("Documents uploaded successfully!");
  //   } catch (error) {
  //     console.error("Upload failed:", error);
  //     alert("Upload failed!");
  //   }
  // };

  // Inside your Profile component

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const mobile = user ? user.mobile : null;

  // Then in handleSubmit (or wherever you send data):

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mobile) {
      alert("User not logged in");
      return;
    }

    const data = new FormData();
    data.append("mobile", mobile); // append mobile from localStorage user object
    data.append("address", formData.address);

    for (const key in formData) {
      if (key !== "address" && formData[key]) {
        data.append(key, formData[key]);
      }
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/upload-documents",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Upload success:", response.data);
      alert("Documents uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error.response?.data || error.message);
      alert("Upload failed!");
    }
  };

  return (
    <div className="profile-container">
      <h2 className="profile-title">Upload Your Documents</h2>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Aadhaar Card (Front)</label>
          <input
            type="file"
            name="aadhaarFront"
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Aadhaar Card (Back)</label>
          <input
            type="file"
            name="aadhaarBack"
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>ID Card (Front)</label>
          <input type="file" name="idFront" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>ID Card (Back)</label>
          <input type="file" name="idBack" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Driving License or Address Proof</label>
          <input
            type="file"
            name="licenseOrProof"
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Your Address</label>
          <textarea
            name="address"
            className="form-control"
            rows="3"
            value={formData.address}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <button type="submit" className="btn btn-primary w-100">
          Submit
        </button>
      </form>
    </div>
  );
};

export default Profile;
