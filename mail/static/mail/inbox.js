document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Add event listener for the form
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});


  function compose_email(reply, replySubject, replyTo, newBody) {

    // Select and input from user
    const submit = document.querySelector('#submit');
    const body = document.querySelector('#compose-body');
    const recipient = document.querySelector('#compose-recipients');
    const subject = document.querySelector('#compose-subject');

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // check if user reply to other email and pre-fill the form fields
    if (reply !== undefined) {
        subject.value = replySubject;
        recipient.value = replyTo;
        body.value = newBody;
    }
    else {
        // Clear out composition fields
        subject.value = '';
        recipient.value = '';
        body.value = '';
    }

    submit.disabled = true;

    // Listen for input to be typed into the input field
    body.onkeyup = () => {
        if (body.value.length > 0) {
            submit.disabled = false;
        }
        else {
            submit.disabled = true;
        }
    }
  }


  function send_email(){
    // Modifies the default behavior so it doesn't reload the page after submitting.
    event.preventDefault();

    const body = document.querySelector('#compose-body');
    const recipient = document.querySelector('#compose-recipients');
    const subject = document.querySelector('#compose-subject');

    // Send the data to the server.
    fetch("/emails", {
      method: "POST",
      body: JSON.stringify({
        recipients: recipient.value,
        subject: subject.value,
        body: body.value,
      }),
    })
    // Take the return data and parse it in JSON format.
    .then((response) => response.json())
    .then((result) => {
        console.log(result);
        load_mailbox("sent", result);
    })
    .catch((error) => console.log(error));
  }


function load_mailbox(mailbox, message = "") {

    // Delete any messages if any
    document.querySelector("#message").textContent = "";

    // Print a message if any.
    if (message !== "") {
        const element = document.createElement('div');

        // check if sent
        if (message["message"]) {
            element.innerHTML = message["message"];
            element.classList.add("success-msg");
            document.querySelector('#message').append(element);
        }
        // check if error
        else {
            element.innerHTML = message["error"];
            element.classList.add("error-msg");
            document.querySelector('#message').append(element);
        }
    }

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // load the emails from API
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        // Print emails
        emails.forEach(email => {
            list_emails(email, mailbox)
        })
    })
    .catch(error => {
        console.log('Error:', error);
    });
}


function list_emails(email, mailbox) {

    // create the HTML elements
    const subject = document.createElement('div');
    const body = document.createElement('div');
    const sender = document.createElement('div');
    const timestamp = document.createElement('div');
    const archiveBtn = document.createElement('button');
    const emailsView = document.querySelector('#emails-view');
    const emailContainer = document.createElement('div');
    // create a boolean to check if archive button is clicked
    let clicked_archive = false;

    // add some classes to the button
    archiveBtn.classList.add("email-element-right");
    archiveBtn.classList.add("button");

    // update the HTML code and add some classes
    subject.innerHTML = email.subject;
    subject.classList.add("email-element");
    body.innerHTML = email.body;
    body.classList.add("email-element");
    sender.innerHTML = email.sender;
    sender.classList.add("email-element");
    timestamp.innerHTML = email.timestamp;
    timestamp.classList.add("email-element-right");

    // if email is not read, change the background color to gray
    if (!email.read) {
        emailContainer.classList.add("unread");
    }

    // add class to div container
    emailContainer.classList.add("border");
    // append the mail info to div container
    emailContainer.append(sender, subject, timestamp);

    // on mouse over, set the cursor to pointer
    emailContainer.onmouseover = () => {
        emailContainer.style = "cursor: pointer";
    }

    // check if mailbox inbox or archive
    if (mailbox === "inbox" || mailbox === "archive"){

        /* on mouse over change the cursor to pointer
               remove the timestamp and add archive button
            */
            emailContainer.onmouseover = () => {
                emailContainer.style = "cursor: pointer";
                timestamp.remove();
                // set the button to be archive or unarchive
                let buttonText = set_archive_button(email);
                archiveBtn.innerHTML = buttonText;
                // append the button to the container
                emailContainer.append(archiveBtn);

                // on click archive or unarchive email
                archiveBtn.onclick = () => {
                    archive_email(email);
                    // set var true to prevent opening the mail
                    clicked_archive = true;
                }
            }
            // on mouse out remove the button and display the timestamp
            emailContainer.onmouseout = () => {
                archiveBtn.remove();
                emailContainer.append(timestamp);
            }

    }

    emailsView.append(emailContainer);
    emailsView.append(document.createElement("hr"));

    // on click open the email
    emailContainer.onclick = function() {
        // open the mail only if clicked_archive is false
        if (!clicked_archive){
            email_view(email);
        }
    }
}


function email_view(email) {

    // create the HTML elements
    const from = document.createElement('div');
    const to = document.createElement('div');
    const body = document.createElement('div');
    const subject = document.createElement('div');
    const timestamp = document.createElement('div');
    const emailView = document.querySelector('#email-view');
    const emailContainer = document.createElement('div');
    const replyBtn = document.createElement('button');
    // add class to the button
    replyBtn.classList.add("button");

    // Hide the other views
    document.querySelector('#email-view').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    // delete innerHTML to prevent other emails from being displayed
    from.innerHTML = "";
    to.innerHTML = "";
    body.innerHTML = "";
    subject.innerHTML = "";
    timestamp.innerHTML = "";
    emailView.innerHTML = "";

    // display the email information
    from.innerHTML = `<strong>From:</strong> ${email.sender}`;
    to.innerHTML = `<strong>To:</strong> ${email.recipients}`;
    subject.innerHTML = `<strong>Subject:</strong> ${email.subject}`;
    timestamp.innerHTML = `<strong>Timestamp:</strong> ${email.timestamp}`;
    body.innerHTML = email.body;
    replyBtn.innerHTML = "Reply";
    emailContainer.append(from, to, subject, timestamp, replyBtn);
    emailView.append(emailContainer);

    emailView.append(document.createElement("hr"));
    emailView.append(body);

    // when user clicks on email, set read true
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })

    /* on click set reply to true
       call the function compose_email with the optional parameters
    */
    replyBtn.onclick = () => {
        let reply = true;
        //replyDate = new Date().toLocaleString();
        // check if subject already starts with RE*
        if (subject.innerHTML.includes("RE:")) {
            subject.innerHTML = `${email.subject}`;
        }
        else {
            subject.innerHTML = `RE: ${email.subject}`;
        }
        from.innerHTML = `${email.sender}`;
        newBody = `On ${email.timestamp}, ${email.sender} wrote: ${body.innerHTML}`
        compose_email(reply, subject.innerHTML, from.innerHTML, newBody);
    }
}


function set_archive_button(email) {

    // check whether the email is archived
    if (email.archived) {
        archived = "Unarchive";
    }
    else {
        archived = "Archive";
    }
    return archived;
}


function set_read_button(email) {

    // check whether the email is archived
    if (email.read) {
        archived = "Mark as read";
    }
    else {
        archived = "Mark as unread";
    }
    return archived;
}


function archive_email(email) {

    // check whether the email is archived or not and set it
    if (!email.archived) {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: true
          })
        });
    }
    else {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: false
          })
        });
    }
    // reload the page
    window.location.reload();
}