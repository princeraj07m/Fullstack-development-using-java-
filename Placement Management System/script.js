// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = {
    dashboard: 'dashboard-section',
    students: 'students-section',
    companies: 'companies-section',
    jobs: 'jobs-section',
    interviews: 'interviews-section',
    drives: 'drives-section',
    placements: 'placements-section',
    reports: 'reports-section'
};

// Menu Toggle
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Close sidebar when clicking on a nav link
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        
        // Add active class to clicked link
        link.classList.add('active');
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
        
        // Navigate to the href (allow default link behavior)
        const href = link.getAttribute('href');
        if (href && href !== '#') {
            window.location.href = href;
        }
    });
});

// Search functionality
const searchInput = document.querySelector('.search-bar input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        console.log('Searching for:', query);
        // Implement search logic here
    });
}

// Notification badge click
const notificationBtn = document.querySelector('.icon-btn');
if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
        console.log('Opening notifications...');
        // Implement notification modal here
    });
}

// Settings button
const settingsBtn = document.querySelectorAll('.icon-btn')[1];
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        console.log('Opening settings...');
        // Implement settings modal here
    });
}

// Quick action buttons
const actionButtons = document.querySelectorAll('.action-btn');
actionButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const text = this.textContent.trim();
        console.log('Action clicked:', text);
        
        // Show appropriate modal or navigate
        if (text.includes('Add New Company')) {
            openCompanyModal();
        } else if (text.includes('Post New Job')) {
            openJobModal();
        } else if (text.includes('Register Student')) {
            openStudentModal();
        } else if (text.includes('Schedule Interview')) {
            openInterviewModal();
        }
    });
});

// Modal functions
function openCompanyModal() {
    console.log('Opening company registration modal...');
    alert('Company registration modal would open here');
    // TODO: Implement actual modal
}

function openJobModal() {
    console.log('Opening job posting modal...');
    alert('Job posting modal would open here');
    // TODO: Implement actual modal
}

function openStudentModal() {
    console.log('Opening student registration modal...');
    alert('Student registration modal would open here');
    // TODO: Implement actual modal
}

function openInterviewModal() {
    console.log('Opening interview scheduling modal...');
    alert('Interview scheduling modal would open here');
    // TODO: Implement actual modal
}

// View All buttons
const viewAllLinks = document.querySelectorAll('.view-all');
viewAllLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('View all clicked');
        // Navigate to detailed view
    });
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
    }
});

// Auto-hide sidebar on page load if on mobile
window.addEventListener('load', () => {
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
    }
});

// Profile link
const profileLink = document.querySelector('.profile-link');
if (profileLink) {
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Opening profile...');
        // Implement profile modal/page
    });
}

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

// Initialize tooltips (if using a tooltip library)
// This is a placeholder for future tooltip implementation

// Set active nav link based on current page
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

console.log('Placement Management System Dashboard Loaded');
