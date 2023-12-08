document.addEventListener('DOMContentLoaded', function () {
  const formElem = document.getElementById('pajak-form');
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
        .getElementById('pajak-form')
        .querySelectorAll('input')
        .forEach((input) => {
          input.removeEventListener('keydown', sendInfo);
        });
    })
    .catch((err) => console.error(err));
}

async function submitForm(event) {
  event.preventDefault();
  const form = document.forms['pajak-form'];

  const [isFilled, elemLabel, elemName] = (() => {
    if (form['email'].value == '') {
      return [false, 'email', 'email'];
    } else if (form['name_user'].value == '') {
      return [false, 'nama', 'name_user'];
    } else if (form['gender'].value == '') {
      return [false, 'jenis kelamin', 'gender'];
    } else if (form['nik'].value == '') {
      return [false, 'nik', 'nik'];
    } else if (form['company'].value == '') {
      return [false, 'perusahaan', 'company'];
    } else if (form['department'].value == '') {
      return [false, 'departemen', 'department'];
    } else if (form['npwp'].value == '') {
      return [false, 'npwp', 'npwp'];
    } else if (form['upload'].files.length == 0) {
      return [false, 'file upload', 'upload'];
    } else {
      return [true, '', ''];
    }
  })();

  if (!isFilled) {
    Swal.fire({ text: `Kolom ${elemLabel} wajib diisi`, title: 'Warning', icon: 'warning' });
    // form[elemName].focus();
    return;
  }

  let file = form['upload'].files;

  if (file.length != 2) {
    Swal.fire({
      text: `File yang diupload harus berjumlah 2 file`,
      title: 'Warning',
      icon: 'warning',
    });
    return;
  }

  if (!file[0].type.startsWith('image/') || !file[1].type.startsWith('image/')) {
    Swal.fire({
      text: `File yang diupload harus berupa gambar`,
      title: 'Warning',
      icon: 'warning',
    });
    return;
  }

  const bodyPayload = {
    email: form['email'].value,
    name: form['name_user'].value,
    company: form['company'].value,
    department: form['department'].value,
    nik: form['nik'].value,
    npwp: form['npwp'].value,
    gender: form['gender'].value,
  };

  const reader1 = new FileReader();
  const reader2 = new FileReader();

  reader1.onloadend = () => {
    let base64string = reader1.result.split(',')[1];
    bodyPayload.upload_file_1 = base64string;

    reader2.readAsDataURL(file[1]);
  };

  reader2.onloadend = async () => {
    const btnSubmit = document.querySelector('.form-btn');
    btnSubmit.setAttribute('disabled', 'disabled');

    let base64string = reader2.result.split(',')[1];

    bodyPayload.upload_file_2 = base64string;
    bodyPayload.id_user = id_user.value;

    try {
      const response = await fetch('/postdjpform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
        mode: 'cors',
      });

      const responseJson = response.json();
      console.log(responseJson);
      let wrapForm = document.getElementById('wrap-form-list');
      wrapForm.querySelectorAll('.question-content').forEach((boxForm) => {
        boxForm.style.display = 'none';
      });

      wrapForm.querySelector('.form-btn').style.display = 'none';
      wrapForm.querySelector('#info-box-form').innerHTML = 'Terima kasih telah mengisi data anda!';
    } catch (error) {
      console.log(error);
      Swal.fire({ title: 'Gagal', text: 'Gagal submit form! Silahkan coba lagi', icon: 'error' });
    } finally {
      btnSubmit.removeAttribute('disabled');
    }
  };

  reader1.readAsDataURL(file[0]);
}
