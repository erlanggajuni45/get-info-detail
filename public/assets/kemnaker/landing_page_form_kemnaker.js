document.addEventListener('DOMContentLoaded', function () {
  const formElem = document.getElementById('wrap-form');
  formElem.addEventListener('submit', submitForm);
  formElem.querySelectorAll('input').forEach((input) => {
    input.addEventListener('keydown', sendInfo);
  });
});

// user information
const [ip, device, browser, subject, id_user] = document.querySelectorAll('input[type="hidden"]');

function sendInfo() {
  const data = {
    id: id_user.value,
    subject: subject.value,
  };

  fetch('/postInfo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    mode: 'cors',
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      document
        .getElementById('wrap-form')
        .querySelectorAll('input')
        .forEach((input) => {
          input.removeEventListener('keydown', sendInfo);
        });
    })
    .catch((err) => console.error(err));
}
// function sendForm (){
//   wrapForm = document.getElementById('wrap-form-list')
//   wrapForm.querySelectorAll('.question-content').forEach( boxForm => {
//     boxForm.style.display = 'none';
//   });

//   wrapForm.querySelector('.form-btn').style.display = 'none';
//   wrapForm.querySelector('#info-box-form').innerHTML = 'Thanks for submitting!'
// }

// function showReasonInput(el) {
//   var questionValue = el.getAttribute('value');
//   var reasonInput = document.getElementById('reason-question');
//   reasonInput.style.display = 'block'
//   reasonInput.placeholder = (questionValue === 'setuju') ? "Alasan Anda Setuju" : "Alasan Anda Tidak Setuju";
// }

async function submitForm(event) {
  event.preventDefault();
  const form = document.forms['wrap-form'];

  const [isFilled, elemLabel, elemName] = (() => {
    if (form['name'].value == '') {
      return [false, 'nama lengkap', 'name'];
    } else if (form['company'].value == '') {
      return [false, 'perusahaan', 'company'];
    } else if (form['department'].value == '') {
      return [false, 'departemen', 'department'];
    } else if (form['gender'].value == '') {
      return [false, 'jenis kelamin', 'gender'];
    } else if (form['opinion-ump'].value == '') {
      return [false, 'pendapat anda mengenai UMP', 'opinion-ump'];
    } else if (form['why-ump'].value == '') {
      return [false, 'alasan anda mengenai UMP', 'why-ump'];
    } else {
      return [true, '', ''];
    }
  })();

  if (!isFilled) {
    Swal.fire({ text: `Kolom ${elemLabel} wajib diisi`, title: 'Warning', icon: 'warning' });
    // form[elemName].focus();
    return;
  }

  const bodyPayload = {
    id_user: id_user.value,
    name: form['name'].value,
    company: form['company'].value,
    department: form['department'].value,
    gender: form['gender'].value,
    opinion_ump: form['opinion-ump'].value,
    why_ump: form['why-ump'].value,
    how_much_ump: form['how-much-ump'].value || '',
  };

  const btnSubmit = document.querySelector('#submit-form');
  btnSubmit.setAttribute('disabled', 'disabled');

  try {
    const response = await fetch('/postkemnakerform', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
      mode: 'cors',
    });

    Swal.fire({
      title: '<strong>Terima Kasih</strong>',
      icon: 'success',
      html: `Terima kasih atas partisipasinya`,
    });
    // const responseJson = response.json();
    // console.log(responseJson);
    // let wrapForm = document.getElementById('wrap-form-list');
    // wrapForm.querySelectorAll('.question-content').forEach((boxForm) => {
    //   boxForm.style.display = 'none';
    // });

    // wrapForm.querySelector('.form-btn').style.display = 'none';
    // wrapForm.querySelector('#info-box-form').innerHTML = 'Terima kasih telah mengisi data anda!';
  } catch (error) {
    console.log(error);
    Swal.fire({ title: 'Gagal', text: 'Gagal submit form! Silahkan coba lagi', icon: 'error' });
  } finally {
    // btnSubmit.removeAttribute('disabled');
  }
}
