const form = document.querySelector('#reg-form');
const fullName = document.querySelector('#fullName');
const email = document.querySelector('#email');
const phone = document.querySelector('#phone');
const genderInputs = document.querySelectorAll('input[name="gender"]');
const course = document.querySelector('#course');
const password = document.querySelector('#password');
const successBox = document.querySelector('#success');
const pwStrength = document.querySelector('#pw-strength');

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^\d{10}$/;
const pwChecks = {
	length: /.{8,}/,
	upper: /[A-Z]/,
	lower: /[a-z]/,
	digit: /[0-9]/,
	special: /[^A-Za-z0-9]/
};

function setError(el, msg){
	const id = el.id ? `err-${el.id}` : null;
	if(id){
		const node = document.getElementById(id);
		node.textContent = msg || '';
	}
	if(msg){ el.classList.add('invalid'); } else { el.classList.remove('invalid'); }
}

function validateName(){
	const v = fullName.value.trim();
	const ok = v.length > 0;
	setError(fullName, ok ? '' : 'Full name is required');
	return ok;
}

function validateEmail(){
	const v = email.value.trim();
	const ok = emailRe.test(v);
	setError(email, ok ? '' : 'Enter a valid email');
	return ok;
}

function validatePhone(){
	const v = phone.value.replace(/\D/g,'');
	const ok = phoneRe.test(v);
	setError(phone, ok ? '' : 'Phone must be 10 digits');
	return ok;
}

function validateGender(){
	const checked = Array.from(genderInputs).some(i => i.checked);
	const node = document.getElementById('err-gender');
	node.textContent = checked ? '' : 'Please select gender';
	return checked;
}

function validateCourse(){
	const ok = course.value.trim() !== '';
	setError(course, ok ? '' : 'Please pick a course');
	return ok;
}

function validatePassword(){
	const v = password.value;
	const results = Object.values(pwChecks).map(re => re.test(v));
	const passed = results.filter(Boolean).length;

	if(passed <= 2) pwStrength.setAttribute('data-strength','weak');
	else if(passed === 3 || passed === 4) pwStrength.setAttribute('data-strength','medium');
	else pwStrength.setAttribute('data-strength','strong');

	const ok = results.every(Boolean);
	setError(password, ok ? '' : 'Password must be 8+ chars, upper, lower, number, special');
	return ok;
}

fullName.addEventListener('input', validateName);
email.addEventListener('input', validateEmail);
phone.addEventListener('input', validatePhone);
course.addEventListener('change', validateCourse);
password.addEventListener('input', validatePassword);
genderInputs.forEach(g => g.addEventListener('change', validateGender));

form.addEventListener('submit', function(e){
	e.preventDefault();
	successBox.textContent = '';

	const ok = [validateName(), validateEmail(), validatePhone(), validateGender(), validateCourse(), validatePassword()].every(Boolean);
	if(!ok){
		successBox.textContent = '';
		return;
	}

	successBox.textContent = 'Registration successful!';
	form.reset();
	pwStrength.removeAttribute('data-strength');

	[fullName,email,phone,course,password].forEach(el => el.classList.remove('invalid'));

	['err-fullName','err-email','err-phone','err-gender','err-course','err-password'].forEach(id => {
		const n = document.getElementById(id); if(n) n.textContent = '';
	});

	setTimeout(() => { successBox.textContent = ''; }, 3500);
});

