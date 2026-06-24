<?php

class NewsletterSmtpMailer extends NewsletterMailer {

    /**
     * @var \PHPMailer\PHPMailer\PHPMailer
     */
    var $mailer;

    function __construct($options) {
        parent::__construct('smtp', $options);
    }

    function get_description() {
        return 'SMTP Addon';
    }

    public function send($message) {
        $logger = $this->get_logger();
        $logger->debug('Start sending to ' . $message->to);
        $mailer = $this->get_mailer();

        if (!empty($message->body)) {
            $mailer->IsHTML(true);
            $mailer->Body = $message->body;
            $mailer->AltBody = $message->body_text;
        } else {
            $mailer->IsHTML(false);
            $mailer->Body = $message->body_text;
            $mailer->AltBody = '';
        }

        $mailer->Subject = $message->subject;

        $mailer->ClearCustomHeaders();
        if (!empty($message->headers)) {
            foreach ($message->headers as $key => $value) {
                $mailer->AddCustomHeader($key, $value);
            }
        }

        if ($message->from) {
            //$logger->debug('Alternative from available');
            $mailer->setFrom($message->from, $message->from_name);
        } else {
            $newsletter = Newsletter::instance();
            $mailer->setFrom($newsletter->options['sender_email'], $newsletter->options['sender_name']);
        }

        $mailer->ClearAddresses();
        $mailer->AddAddress($message->to);
        $mailer->Send();

        if ($mailer->IsError()) {

            $logger->fatal($mailer->ErrorInfo);
            // If the error is due to SMTP connection, the mailer cannot be reused since it does not clean up the connection
            // on error.
            //$this->mailer = null;
            $message->error = $mailer->ErrorInfo;
            if (empty($this->options['continue_on_error'])) {
                $error_type = self::ERROR_FATAL;

                // Specific email error, not service error
                if (stripos($mailer->ErrorInfo, 'The following recipients failed') !== false) {
                    $error_type = self::ERROR_GENERIC;
                }
                return new WP_Error($error_type, $mailer->ErrorInfo);
            } else {
                return new WP_Error(self::ERROR_GENERIC, $mailer->ErrorInfo);
            }
        }

        $logger->debug('Sent ' . $message->to);
        //$logger->error('Time: ' . (microtime(true) - $start) . ' seconds');
        return true;
    }

    /**
     *
     * @return PHPMailer
     */
    function get_mailer() {

        global $wp_version;

        if ($this->mailer) {
            return $this->mailer;
        }

        $logger = $this->get_logger();
        $logger->info('Setting up PHP mailer');

        if (!class_exists('PHPMailer')) {

            require_once ABSPATH . WPINC . '/PHPMailer/PHPMailer.php';
            require_once ABSPATH . WPINC . '/PHPMailer/SMTP.php';
            require_once ABSPATH . WPINC . '/PHPMailer/Exception.php';

            class_alias(\PHPMailer\PHPMailer\PHPMailer::class, 'PHPMailer');
            class_alias(\PHPMailer\PHPMailer\SMTP::class, 'SMTP');
            class_alias(\PHPMailer\PHPMailer\Exception::class, 'phpmailerException');
        }

        $this->mailer = new \PHPMailer(false);

        $this->mailer->XMailer = ' '; // A space!

        $this->mailer->IsSMTP();
        $this->mailer->Host = $this->options['host'];
        if (!empty($this->options['port'])) {
            $this->mailer->Port = (int) $this->options['port'];
        }

        if (!empty($this->options['user'])) {
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = $this->options['user'];
            $this->mailer->Password = $this->options['pass'];
        }

        $this->mailer->SMTPSecure = $this->options['secure'];
        $this->mailer->SMTPAutoTLS = false;

        if ($this->options['ssl_insecure'] == 1) {
            $this->mailer->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );
        }

        $newsletter = Newsletter::instance();

        $this->mailer->CharSet = 'UTF-8';
        $this->mailer->From = $newsletter->options['sender_email'];

        if (!empty($newsletter->options['return_path'])) {
            $this->mailer->Sender = $newsletter->options['return_path'];
        }
        if (!empty($newsletter->options['reply_to'])) {
            $this->mailer->AddReplyTo($newsletter->options['reply_to']);
        }

        $this->mailer->FromName = $newsletter->options['sender_name'];

        return $this->mailer;
    }
}
