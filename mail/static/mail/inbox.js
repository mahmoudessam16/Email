document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Submit compose-form
  document.querySelector("#compose-form").addEventListener("submit", send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#view-email-details').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email-details').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the email
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // I will loop through emails 
      emails.forEach(everyMail => {
        const newEmail = document.createElement("div");
        // newEmail.className = "list-group-item";
        newEmail.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border: 1px solid black; padding: 7px">
            <div style="display: flex; justify-content: space-between; align-items: center">
                <h4>${everyMail.sender}</h4>
                <h4 style="font-weight: normal; margin-left: 20px">*${everyMail.subject}</h4>
            </div>
            <p>${everyMail.timestamp}</p>
        </div>
        `;
        // Change bg-color
        if (everyMail.read) {
          newEmail.style.backgroundColor = "#d5d5d5";
        } else {
          newEmail.style.backgroundColor = "white";
        }
        // Add click event for each mail
        newEmail.addEventListener('click', () => view_email(everyMail.id));
        document.querySelector("#emails-view").append(newEmail);
      });
  });
}

function send_email(e) {
  e.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Sending Data
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      load_mailbox('sent')
  });

}

function view_email(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#view-email-details').style.display = 'block';

    document.querySelector('#view-email-details').innerHTML = `
        <ul class="list-group list-group-flush">
            <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
            <li class="list-group-item"><strong>To:</strong> ${email.recipients}</li>
            <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
            <li class="list-group-item"><strong>Timestamp:</strong> ${email.timestamp}</li>
            <li class="list-group-item">${email.body}</li>
        </ul>
    `;
    
    if (!email.read) {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }
    const archivedBtn = document.createElement("button");
    archivedBtn.innerHTML = email.archived === true ? "Unarchived" : "Archive";
    archivedBtn.className = email.archived === true ? "btn btn-success" : "btn btn-danger";
    archivedBtn.style.marginTop = "30px"
    archivedBtn.addEventListener('click', function() {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !email.archived
        })
      }).then(() => { load_mailbox("archive") })
    });
    document.querySelector('#view-email-details').append(archivedBtn);
    
    // Reply Button
    const replyBtn = document.createElement("button");
    replyBtn.innerHTML = "Reply";
    replyBtn.className = "btn btn-warning";
    replyBtn.style.cssText = "display: inline; margin: 30px 0 0 10px;";
    replyBtn.addEventListener('click', function() {
      compose_email()
      document.querySelector('#compose-recipients').value = email.sender;
      let subject = email.subject;
      if (subject.split(" ", 1)[0] != "Re:") {
        subject = "Re: " + email.subject;
      }
      document.querySelector('#compose-subject').value = subject;
      document.querySelector('#compose-body').value = `On '${email.timestamp}' "${email.sender}" wrote: ${email.body}`;
    });
    document.querySelector('#view-email-details').append(replyBtn);
    
  });
}
