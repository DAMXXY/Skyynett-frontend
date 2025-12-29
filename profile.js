// Load user info
window.addEventListener("DOMContentLoaded", () => {
    const loggedUser = localStorage.getItem("username");
    const users = JSON.parse(localStorage.getItem("users")) || [];
  
    if (!loggedUser) {
      alert("⚠️ You must be logged in to view this page.");
      window.location.href = "index.html";
      return;
    }
  
    const currentUser = users.find(u => u.username === loggedUser);
    if (currentUser) {
      document.getElementById("profileUsername").textContent = currentUser.username;
      document.getElementById("profileEmail").textContent = currentUser.email;
    }
  });
  
  // Show Change Password form
  document.getElementById("showChangePass").addEventListener("click", () => {
    document.getElementById("changePassForm").style.display = "block";
  });
  
  // Update password
  document.getElementById("updatePassword").addEventListener("click", () => {
    const oldPass = document.getElementById("oldPassword").value;
    const newPass = document.getElementById("newPassword").value;
    const confirmNew = document.getElementById("confirmNewPassword").value;
  
    let users = JSON.parse(localStorage.getItem("users")) || [];
    const loggedUser = localStorage.getItem("username");
    const userIndex = users.findIndex(u => u.username === loggedUser);
  
    if (userIndex === -1) {
      alert("⚠️ User not found.");
      return;
    }
  
    if (users[userIndex].password !== oldPass) {
      alert("❌ Old password is incorrect.");
      return;
    }
  
    if (newPass !== confirmNew) {
      alert("⚠️ New passwords do not match.");
      return;
    }
  
    users[userIndex].password = newPass;
    localStorage.setItem("users", JSON.stringify(users));
    alert("✅ Password updated successfully!");
    document.getElementById("changePassForm").style.display = "none";
  });
  
  // Logout
  document.getElementById("logoutProfile").addEventListener("click", () => {
    localStorage.removeItem("username");
    alert("You have been logged out.");
    window.location.href = "index.html";
  });
  