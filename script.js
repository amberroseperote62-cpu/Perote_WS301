// =====================================================
// Student Registration Form - JavaScript
// WS 301 Performance Task: Form Validation
// =====================================================

"use strict";

// =====================================================
// 1. SELECT MAIN ELEMENTS
// =====================================================
const form = document.getElementById("registrationForm");
const successMessage = document.getElementById("successMessage");
const dobInput = document.getElementById("dob");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirmPassword");
const fullNameInput = document.getElementById("fullName");

// Every element with a data-validation attribute is a field to validate.
// They are returned in the same order they appear on the page.
const fields = Array.from(form.querySelectorAll("[data-validation]"));


// =====================================================
// 2. VALIDATION PATTERNS
// =====================================================
const patterns = {
  studentId: /^\d{4}-\d{5}$/,                                   // 2024-00123
  name:      /^[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F.'\- ]*$/, // letters, spaces, . ' -
  email:     /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,                   // name@domain.com
  phone:     /^09\d{9}$/,                                       // 09XXXXXXXXX
  password:  /^(?=.*[A-Za-z])(?=.*\d).+$/                       // letter + number
};


// =====================================================
// 3. ATTRIBUTE MANIPULATION: LIMIT THE DATE PICKER
// =====================================================
// Returns today's date as YYYY-MM-DD (the format a date input expects).
function getTodayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return now.getFullYear() + "-" + month + "-" + day;
}

// Set the "max" attribute so future dates cannot be picked.
dobInput.setAttribute("max", getTodayString());


// =====================================================
// 4. ERROR DISPLAY HELPERS
// =====================================================

// Mark a field invalid: show its message, add .error, set aria-invalid="true".
function showError(field, message) {
  const errorElement = document.getElementById(field.id + "Error");

  errorElement.textContent = message;
  field.classList.add("error");                  // classList.add()
  field.setAttribute("aria-invalid", "true");    // attribute manipulation

  // The checkbox sits inside a styled row, so highlight the row too.
  if (field.type === "checkbox") {
    field.closest(".checkbox-row").classList.add("error");
  }
}

// Mark a field valid: clear its message, remove .error, set aria-invalid="false".
function clearError(field) {
  const errorElement = document.getElementById(field.id + "Error");

  errorElement.textContent = "";
  field.classList.remove("error");               // classList.remove()
  field.setAttribute("aria-invalid", "false");

  if (field.type === "checkbox") {
    field.closest(".checkbox-row").classList.remove("error");
  }
}


// =====================================================
// 5. DATA-DRIVEN VALIDATION
// =====================================================
// Reads field.dataset (validation, required, label, minLength) to decide
// which rule to run and which message to show. Returns true when valid.
function validateField(field) {
  const type = field.dataset.validation;
  const isRequired = field.dataset.required === "true";
  const label = field.dataset.label;
  const minLength = Number(field.dataset.minLength) || 0;
  let message = "";

  // trim() text-like inputs to remove unnecessary spaces.
  // Passwords, radio groups and checkboxes are left untouched.
  const skipTrim = ["password", "confirm", "radio", "checkbox"];
  if (!skipTrim.includes(type)) {
    field.value = field.value.trim();
  }
  const value = field.value;

  switch (type) {

    case "studentId":
      if (value === "" && isRequired) {
        message = "Please enter your " + label + ".";
      } else if (!patterns.studentId.test(value)) {
        message = "Student ID must look like 2024-00123 (4 digits, a dash, 5 digits).";
      }
      break;

    case "name":
      if (value === "" && isRequired) {
        message = "Please enter your full name.";
      } else if (!patterns.name.test(value)) {
        message = "Full name may only contain letters, spaces, periods, apostrophes and hyphens.";
      } else if (value.split(/\s+/).length < 2) {
        message = "Please enter both your first name and last name.";
      }
      break;

    case "email":
      if (value === "" && isRequired) {
        message = "Please enter your email address.";
      } else if (!patterns.email.test(value)) {
        message = "Please enter a valid email address (e.g. name@example.com).";
      }
      break;

    case "phone":
      if (value === "" && isRequired) {
        message = "Please enter your phone number.";
      } else if (!patterns.phone.test(value)) {
        message = "Phone number must use the format 09XXXXXXXXX (11 digits).";
      }
      break;

    case "date":
      if (value === "" && isRequired) {
        message = "Please select your date of birth.";
      } else if (new Date(value) > new Date()) {
        message = "Date of birth cannot be in the future.";
      } else if (new Date(value).getFullYear() < 1920) {
        message = "Please enter a realistic date of birth.";
      }
      break;

    case "radio": {
      // The field is the <fieldset>; look for a checked radio inside it.
      const chosen = field.querySelector('input[type="radio"]:checked');
      if (!chosen && isRequired) {
        message = "Please select your " + label.toLowerCase() + ".";
      }
      break;
    }

    case "select":
      if (value === "" && isRequired) {
        message = "Please select your " + label.toLowerCase() + ".";
      }
      break;

    case "password":
      if (value === "" && isRequired) {
        message = "Please enter a password.";
      } else if (value.length < minLength) {
        message = "Password must be at least " + minLength + " characters long.";
      } else if (!patterns.password.test(value)) {
        message = "Password must contain at least one letter and one number.";
      }
      break;

    case "confirm":
      if (value === "" && isRequired) {
        message = "Please confirm your password.";
      } else if (value !== passwordInput.value) {
        message = "Passwords do not match.";
      }
      break;

    case "text": // generic text such as Address
      if (value === "" && isRequired) {
        message = "Please enter your " + label.toLowerCase() + ".";
      } else if (value.length < minLength) {
        message = label + " must be at least " + minLength + " characters long.";
      }
      break;

    case "checkbox":
      if (!field.checked && isRequired) {
        message = "You must agree to the registration terms before registering.";
      }
      break;
  }

  if (message !== "") {
    showError(field, message);
    return false;
  }

  clearError(field);
  return true;
}


// =====================================================
// 6. SUBMIT EVENT
// =====================================================
form.addEventListener("submit", function (event) {

  // Stop the browser from submitting / reloading the page.
  event.preventDefault();

  // Hide any previous success message before checking again.
  hideSuccess();

  // Validate EVERY field so all errors appear together.
  const results = fields.map(function (field) {
    return validateField(field);
  });

  const formIsValid = results.every(function (result) {
    return result === true;
  });

  if (formIsValid) {
    showSuccess();
  } else {
    // Move focus to the first invalid field to help the user fix it.
    const firstInvalid = fields.find(function (field) {
      return field.classList.contains("error");
    });

    const focusTarget = firstInvalid.matches("fieldset")
      ? firstInvalid.querySelector("input")
      : firstInvalid;

    focusTarget.focus();
  }
});


// =====================================================
// 7. SUCCESS MESSAGE
// =====================================================
function showSuccess() {
  successMessage.textContent =
    "Registration successful! Thank you, " + fullNameInput.value + ". " +
    "(This is a front-end demonstration; no data was saved.)";

  successMessage.classList.add("success");   // success class
  successMessage.hidden = false;             // attribute manipulation: reveal message
  successMessage.scrollIntoView({ behavior: "smooth", block: "start" });

  // The form is intentionally NOT cleared so the success state stays visible.
}

function hideSuccess() {
  successMessage.textContent = "";
  successMessage.classList.remove("success");
  successMessage.hidden = true;
}


// =====================================================
// 8. CORRECT ERRORS WHILE TYPING / CHANGING
// =====================================================
fields.forEach(function (field) {

  // Only re-validate fields that currently show an error,
  // so users are not scolded before they finish typing.
  function recheck() {
    if (field.classList.contains("error")) {
      validateField(field);
    }
  }

  field.addEventListener("input", recheck);
  field.addEventListener("change", recheck);
});

// If the password changes, the confirm field may become valid or invalid.
passwordInput.addEventListener("input", function () {
  if (confirmInput.value !== "") {
    validateField(confirmInput);
  }
});


// =====================================================
// 9. SHOW / HIDE PASSWORD
// =====================================================
document.querySelectorAll(".toggle-password").forEach(function (button) {

  button.addEventListener("click", function (event) {

    // event.currentTarget is the button that was clicked.
    const clickedButton = event.currentTarget;
    const input = document.getElementById(clickedButton.dataset.target); // data-target
    const container = input.closest(".password-field");

    // classList.toggle() adds "show-password" if missing and removes it if present.
    // It returns true when the class is now ON (password visible).
    const isVisible = container.classList.toggle("show-password");

    // Attribute manipulation: switch the input type to show or hide the text.
    input.setAttribute("type", isVisible ? "text" : "password");

    // Keep the button label and accessibility state in sync.
    clickedButton.textContent = (isVisible ? "Hide " : "Show ") + input.dataset.label;
    clickedButton.setAttribute("aria-pressed", String(isVisible));
  });
});


// =====================================================
// 10. RESET
// =====================================================
// The browser clears the field values; this handler clears everything else.
form.addEventListener("reset", function () {

  // Remove every error message, .error class and aria-invalid attribute.
  fields.forEach(function (field) {
    clearError(field);
    field.removeAttribute("aria-invalid");
  });

  // Remove the success message.
  hideSuccess();

  // Return both password fields and their buttons to the hidden state.
  document.querySelectorAll(".toggle-password").forEach(function (button) {
    const input = document.getElementById(button.dataset.target);

    input.closest(".password-field").classList.remove("show-password");
    input.setAttribute("type", "password");
    button.textContent = "Show " + input.dataset.label;
    button.setAttribute("aria-pressed", "false");
  });

  // Recalculate the date "max" in case the page stayed open past midnight.
  dobInput.setAttribute("max", getTodayString());
});