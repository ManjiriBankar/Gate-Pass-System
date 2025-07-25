// import React from 'react';
// import './About.css'; // Optional: if you want to separate CSS

// const teamMembers = [
//   { name: 'Manjiri Bankar', role: 'Frontend Developer', image: '/team1.jpg' },
//   { name: 'Riya Avasthi', role: 'Backend Developer', image: '/team2.jpg' },
//   { name: 'Sahil Brahmankar', role: 'UI/UX Designer', image: '/team3.jpg' },
// ];

// const guide = {
//   name: 'Dr. B.S. Tarle',
//   role: 'Project Guide & Mentor',
//   image: '/HOD.jpg'
// };

// function AboutUs() {
//   return (
//     <div className="">
//       <div >
//         <h1 >About Us</h1>
//         <p >
//           Welcome to the Faculty Gate Pass System – a smart, secure, and paperless solution for managing faculty movement digitally within KBTCOE.
//         </p>
//       </div>

//       <div className="max-w-4xl mx-auto mb-16">
//         <h2 className="text-2xl font-semibold mb-2">Our Vision</h2>
//         <p className="mb-6">To lead innovation in smart campus solutions through efficient and secure digital transformation.</p>

//         <h2 className="text-2xl font-semibold mb-2">Our Mission</h2>
//         <ul className="list-disc list-inside">
//           <li>Streamline faculty gate pass approvals</li>
//           <li>Ensure secure and real-time data access</li>
//           <li>Promote eco-friendly paperless administration</li>
//         </ul>
//       </div>

//       <div className="text-center mb-10">
//         <h2 className="text-3xl font-semibold mb-6">Our Team</h2>
//         <div className="flex flex-wrap justify-center gap-8">
//           {teamMembers.map((member, idx) => (
//             <div key={idx} className="w-60 shadow-md p-4 rounded-lg bg-blue-50">
//               <img src={member.image} alt={member.name} className="rounded-full w-32 h-32 mx-auto mb-4 object-cover" />
//               <h3 className="text-xl font-semibold">{member.name}</h3>
//               <p className="text-sm text-gray-600">{member.role}</p>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div >
//         <h2 >Our Guide</h2>
//         <div >
//           <img src={guide.image} alt={guide.name} />
//           <h3 >{guide.name}</h3>
//           <p >{guide.role}</p>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default AboutUs;


import React from 'react';
import './About.css';

const teamMembers = [
    { name: 'Manjiri Bankar', role: 'Full Stack Developer', post: 'BE Computer Engineering Student', image: '/Manjiri.jpg' },
    { name: 'Riya Avasthi', role: 'Full Stack Developer', post: 'BE Computer Engineering Student', image: '/Riya.jpg' },
    { name: 'Sahil Brahmankar', role: 'Full Stack Developer', post: 'BE Computer Engineering Student', image: '/Sahil.jpg' },
];

const guide = {
    name: 'Dr. B.S. Tarle',
    role: 'Project Guide & Mentor',
    post: 'Head of Computer Engineering Department',
    image: '/HOD.jpg',
};

function AboutUs() {
    return (
        <div className="about-container">
            {/* 👇 Top college header (same as Login page) */}
            <div className="college-header">
                <img src="/logo.jpg" alt="College Logo" className="college-logo-Auth" />
                <div className="college-info">
                    <h2>Maratha Vidya Prasarak Samaj's</h2>
                    <h1>Karmaveer Adv. Baburao Ganpatrao Thakare College of Engineering</h1>
                    <p>Udoji Maratha Boarding Campus, Near Pumping Station, Gangapur Road, Nashik</p>
                    <p className="university-affiliation">An Autonomous Institute Permanently affiliated to Savitribai Phule Pune University</p>
                </div>
                <div className="college-accreditation">
                    <img src="/naac.png" alt="NAAC A+" className="accreditation-logo" />
                </div>
            </div>

            {/* 👇 About Section */}
            <div className="about-content">
                <h1 className="main-title">About Us</h1>
                <p className="subtitle">
                    Welcome to the Faculty Gate Pass System – a smart, secure, and paperless solution for managing faculty movement digitally within KBTCOE.
                </p>

                <div className="vision-mission-with-image">
                    <div className="vision-mission-text">
                        <h2>Our Vision</h2>
                        <p>
                            To become a benchmark in academic infrastructure digitization by providing a secure, efficient, and transparent gate pass system that enhances operational ease for faculty, administrators, and security personnel alike.
                        </p>

                        <h2>Our Mission</h2>
                        <p>
                            Our mission is to streamline faculty movement management through a unified web-based platform that minimizes paperwork, accelerates approval workflows, and ensures real-time visibility for all stakeholders, fostering a smarter and more accountable campus environment.
                        </p>
                    </div>

                    <div className="vision-mission-image">
                        <img src="/team-img.jpg" alt="Team Illustration" />
                    </div>
                </div>


                <div className="team-section">
                    <h2>Our Team</h2>
                    <div className="team-grid">
                        {teamMembers.map((member, index) => (
                            <div className="card" key={index}>
                                <img src={member.image} alt={member.name} />
                                <h3>{member.name}</h3>
                                <p>{member.role}</p>
                                <p><strong>{member.post}</strong></p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="guide-section">
                    <h2>Our Guide</h2>
                    <div className="guide-card">
                        <img src={guide.image} alt={guide.name} />
                        <h3>{guide.name}</h3>
                        <p>{guide.role}</p>
                        <p><strong>{guide.post}</strong></p>
                    </div>
                </div>
            </div>
            <footer style={{ backgroundColor: '#1e3a8a', color: 'white', textAlign: 'center', padding: '1rem', marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <p>&copy; 2025 KBTCOE. All rights reserved.</p>
                
            </footer>
        </div>
    );
}

export default AboutUs;
