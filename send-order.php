<?php

use PHPMailer\PHPMailer\Exception as MailException;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

require __DIR__ . '/vendor/phpmailer/src/Exception.php';
require __DIR__ . '/vendor/phpmailer/src/PHPMailer.php';
require __DIR__ . '/vendor/phpmailer/src/SMTP.php';

define('SITE_NAME', 'ФотоЦентр Видное');

function post_value($key, $limit = 1000)
{
    $value = isset($_POST[$key]) ? (string) $_POST[$key] : '';
    $value = trim(str_replace(array("\r", "\0"), '', $value));
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $limit, 'UTF-8');
    }
    return substr($value, 0, $limit);
}

function redirect_to($path)
{
    header('Location: ' . $path, true, 303);
    exit;
}

function normalize_email($email)
{
    $email = trim((string) $email);
    return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '';
}

function html_escape($value)
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function send_smtp_mail($config, $subject, $htmlBody, $textBody)
{
    $host = isset($config['smtp_host']) ? (string) $config['smtp_host'] : 'smtp.timeweb.ru';
    $port = isset($config['smtp_port']) ? (int) $config['smtp_port'] : 465;
    $secure = isset($config['smtp_secure']) ? strtolower((string) $config['smtp_secure']) : 'ssl';
    $username = isset($config['smtp_username']) ? normalize_email($config['smtp_username']) : '';
    $password = isset($config['smtp_password']) ? (string) $config['smtp_password'] : '';
    $fromEmail = isset($config['from_email']) ? normalize_email($config['from_email']) : $username;
    $fromName = isset($config['from_name']) ? (string) $config['from_name'] : SITE_NAME;
    $toEmail = isset($config['to_email']) ? normalize_email($config['to_email']) : $username;

    if ($host === '' || $username === '' || $password === '' || $fromEmail === '' || $toEmail === '') {
        throw new Exception('SMTP config is incomplete.');
    }

    $mail = new PHPMailer(true);
    $mail->CharSet = PHPMailer::CHARSET_UTF8;
    $mail->isSMTP();
    $mail->SMTPDebug = SMTP::DEBUG_OFF;
    $mail->Host = $host;
    $mail->Port = $port;
    $mail->Timeout = 20;
    $mail->SMTPAuth = true;
    $mail->Username = $username;
    $mail->Password = $password;

    if ($secure === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } elseif ($secure === 'tls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    } else {
        $mail->SMTPSecure = false;
        $mail->SMTPAutoTLS = false;
    }

    $mail->setFrom($fromEmail, $fromName);
    $mail->addAddress($toEmail);
    $mail->addReplyTo($fromEmail, $fromName);
    $mail->Subject = $subject;
    $mail->isHTML(true);
    $mail->Body = $htmlBody;
    $mail->AltBody = $textBody;
    $mail->send();
}

if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_to('./index.html#order');
}

if (post_value('botcheck') !== '') {
    redirect_to('./thanks.html');
}

$configPath = dirname(__FILE__) . '/send-order.config.php';
if (!is_file($configPath)) {
    error_log('[order-form] Config file not found.');
    redirect_to('./index.html#order');
}

$config = require $configPath;
if (!is_array($config)) {
    error_log('[order-form] Config file must return array.');
    redirect_to('./index.html#order');
}

$name = post_value('Имя', 120);
$phone = post_value('Телефон', 80);
$contactMethod = post_value('contact_method', 120);
if ($contactMethod === '') {
    $contactMethod = post_value('Удобный способ связи', 120);
}
$service = post_value('order_service', 160);
if ($service === '') {
    $service = post_value('Услуга', 160);
}
$details = post_value('order_details', 2000);
if ($details === '') {
    $details = post_value('Детали', 2000);
}
$time = post_value('order_time', 300);
if ($time === '') {
    $time = post_value('Удобное время', 300);
}

if ($name === '' || $phone === '') {
    redirect_to('./index.html#order');
}

$detailsValue = $details !== '' ? $details : 'не указаны';
$timeValue = $time !== '' ? $time : 'не указано';
$contactMethodValue = $contactMethod !== '' ? $contactMethod : 'не указан';

$textBody = implode("\n", array(
    'Новая заявка с сайта ' . SITE_NAME,
    '------------------------------',
    'Имя: ' . $name,
    'Телефон: ' . $phone,
    'Удобный способ связи: ' . $contactMethodValue,
    'Услуга: ' . ($service !== '' ? $service : 'не указана'),
    'Детали: ' . $detailsValue,
    'Удобное время: ' . $timeValue,
));

$htmlBody = '<!doctype html><html><body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,sans-serif;color:#182033;">'
    . '<div style="max-width:640px;margin:0 auto;padding:24px;">'
    . '<div style="background:#ffffff;border:1px solid #e5e8f0;border-radius:12px;padding:24px;">'
    . '<h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:#182033;">Новая заявка с сайта ФотоЦентр</h1>'
    . '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:16px;line-height:1.5;">'
    . '<tr><td style="padding:10px 0;color:#687086;width:150px;border-top:1px solid #edf0f5;">Имя</td><td style="padding:10px 0;border-top:1px solid #edf0f5;"><strong>' . html_escape($name) . '</strong></td></tr>'
    . '<tr><td style="padding:10px 0;color:#687086;border-top:1px solid #edf0f5;">Телефон</td><td style="padding:10px 0;border-top:1px solid #edf0f5;"><strong>' . html_escape($phone) . '</strong></td></tr>'
    . '<tr><td style="padding:10px 0;color:#687086;border-top:1px solid #edf0f5;">Связаться</td><td style="padding:10px 0;border-top:1px solid #edf0f5;"><strong>' . html_escape($contactMethodValue) . '</strong></td></tr>'
    . '<tr><td style="padding:10px 0;color:#687086;border-top:1px solid #edf0f5;">Услуга</td><td style="padding:10px 0;border-top:1px solid #edf0f5;">' . html_escape($service !== '' ? $service : 'не указана') . '</td></tr>'
    . '<tr><td style="padding:10px 0;color:#687086;border-top:1px solid #edf0f5;">Детали</td><td style="padding:10px 0;border-top:1px solid #edf0f5;">' . nl2br(html_escape($detailsValue)) . '</td></tr>'
    . '<tr><td style="padding:10px 0;color:#687086;border-top:1px solid #edf0f5;">Удобное время</td><td style="padding:10px 0;border-top:1px solid #edf0f5;">' . html_escape($timeValue) . '</td></tr>'
    . '</table>'
    . '<p style="margin:18px 0 0;color:#687086;font-size:13px;">Заявка отправлена с формы на сайте fotouslugi-vidnoe.ru.</p>'
    . '</div></div></body></html>';

try {
    send_smtp_mail($config, 'Новая заявка с сайта ФотоЦентр', $htmlBody, $textBody);
} catch (MailException $error) {
    $smtpHost = isset($config['smtp_host']) ? $config['smtp_host'] : 'smtp.timeweb.ru';
    $smtpPort = isset($config['smtp_port']) ? $config['smtp_port'] : '465';
    $smtpSecure = isset($config['smtp_secure']) ? $config['smtp_secure'] : 'ssl';
    error_log('[order-form] PHPMailer host=' . $smtpHost . ' port=' . $smtpPort . ' secure=' . $smtpSecure . ': ' . $error->getMessage());
    redirect_to('./index.html#order');
} catch (Exception $error) {
    error_log('[order-form] ' . $error->getMessage());
    redirect_to('./index.html#order');
}

$redirect = post_value('redirect', 500);
$redirectPath = './thanks.html';
if ($redirect !== '') {
    $parts = parse_url($redirect);
    if (is_array($parts) && empty($parts['host']) && !empty($parts['path'])) {
        $redirectPath = $redirect;
    }
}

redirect_to($redirectPath);
