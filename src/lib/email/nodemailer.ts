import nodemailer from 'nodemailer'

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await getTransporter().sendMail({
    from: `"AI ტრენერი" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'პაროლის აღდგენა — AI ტრენერი',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#16a34a;margin-bottom:8px">AI ტრენერი</h2>
        <p style="color:#374151;margin-bottom:24px">პაროლის აღდგენის მოთხოვნა მიღებულია.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
          პაროლის შეცვლა
        </a>
        <p style="color:#6b7280;font-size:13px;margin-top:24px">
          ლინკი მოქმედებს 1 საათი.<br>
          თუ ეს მოთხოვნა თქვენი არ არის — უგულებელყავით ეს ელფოსტა.
        </p>
      </div>
    `,
  })
}

export async function sendAdminOtpEmail(email: string, otp: string) {
  await getTransporter().sendMail({
    from: `"AI ტრენერი" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `ადმინ კოდი: ${otp} — AI ტრენერი`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#16a34a;margin-bottom:8px">ადმინ შესვლის კოდი</h2>
        <p style="color:#374151;margin-bottom:16px">ადმინ პანელში შესვლის ერთჯერადი კოდი:</p>
        <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#15803d">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px">კოდი მოქმედებს 10 წუთი. თუ ეს მოთხოვნა თქვენი არ არის — შეატყობინეთ.</p>
      </div>
    `,
  })
}
