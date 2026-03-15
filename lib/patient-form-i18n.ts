export const FORM_LANGUAGES = ["en", "es", "ar", "zh-Hans", "zh-Hant"] as const;

export type FormLanguage = (typeof FORM_LANGUAGES)[number];

export const FORM_LANGUAGE_LABELS: Record<FormLanguage, string> = {
    en: "English",
    es: "Spanish",
    ar: "Arabic",
    "zh-Hans": "Chinese (Simplified)",
    "zh-Hant": "Chinese (Traditional)",
};

export const FORM_LANGUAGE_NATIVE_NAMES: Record<FormLanguage, string> = {
    en: "English",
    es: "Español",
    ar: "العربية",
    "zh-Hans": "简体中文",
    "zh-Hant": "繁體中文",
};

export function normalizeFormLanguage(value?: string | null): FormLanguage {
    return FORM_LANGUAGES.includes(value as FormLanguage)
        ? (value as FormLanguage)
        : "en";
}

export function isRtlLanguage(language: FormLanguage): boolean {
    return language === "ar";
}

interface PatientFormCopy {
    pageEyebrow: string;
    loading: string;
    unavailableTitle: string;
    unavailableDescription: string;
    secureBadge: string;
    secureFormEyebrow: string;
    shortFormHint: string;
    wizardTitle: string;
    wizardDescription: string;
    reviewTitle: string;
    reviewDescription: string;
    consentTitle: string;
    consentToggleOpen: string;
    consentToggleClose: string;
    consentVersionLabel: string;
    consentAgreement: string;
    submit: string;
    submitting: string;
    next: string;
    back: string;
    stepOf: (current: number, total: number) => string;
    percentComplete: (value: number) => string;
    selectOption: string;
    encryptedFooter: string;
    encryptedSubmission: string;
    requiredField: (label: string) => string;
    invalidEmail: string;
    invalidNumber: string;
    invalidSelection: string;
    consentRequired: string;
    stepIncomplete: string;
    addressPlaceholder: string;
    unitPlaceholder: string;
    fixErrors: string;
    submittedTitle: string;
    submittedDescription: string;
    submittedBody: string;
    submittedCloseHint: string;
    consentNoticeText: string;
}

export const PATIENT_FORM_COPY: Record<FormLanguage, PatientFormCopy> = {
    en: {
        pageEyebrow: "Patient intake",
        loading: "Loading your form...",
        unavailableTitle: "Form Unavailable",
        unavailableDescription:
            "This form link is invalid, has expired, or has already been submitted. Please contact the clinic for a new link.",
        secureBadge: "Encrypted submission",
        secureFormEyebrow: "Secure patient form",
        shortFormHint:
            "Complete the form below, then review the consent notice before submitting.",
        wizardTitle: "Form progress",
        wizardDescription:
            "Longer forms are split into smaller steps so patients can move through them more clearly.",
        reviewTitle: "Review and submit",
        reviewDescription:
            "Confirm consent, then send the completed intake form to the clinic.",
        consentTitle: "Consent for Collection of Personal Information",
        consentToggleOpen: "Read full consent text",
        consentToggleClose: "Hide full consent text",
        consentVersionLabel: "Consent version",
        consentAgreement:
            "I have read and agree to the collection, use, and disclosure of my personal information as described in the consent notice above.",
        submit: "Submit Form",
        submitting: "Submitting...",
        next: "Next Step",
        back: "Back",
        stepOf: (current, total) => `Step ${current} of ${total}`,
        percentComplete: (value) => `${value}% complete`,
        selectOption: "Select an option",
        encryptedFooter:
            "Your information is encrypted in transit and stored securely for the clinic.",
        encryptedSubmission: "Encrypted submission",
        requiredField: (label) => `${label} is required`,
        invalidEmail: "Please enter a valid email",
        invalidNumber: "Please enter a valid number",
        invalidSelection: "Please choose one of the available options",
        consentRequired:
            "Please review and accept the consent notice before submitting.",
        stepIncomplete: "Please complete this step before continuing",
        addressPlaceholder: "Start typing your address...",
        unitPlaceholder: "Apt / Suite / Unit",
        fixErrors: "Please complete the required fields before submitting.",
        submittedTitle: "Form Submitted Successfully",
        submittedDescription:
            "Thank you for completing your patient intake form.",
        submittedBody:
            "Your information has been securely encrypted and sent to the clinic. The clinic staff will review your submission before your appointment.",
        submittedCloseHint:
            "You may close this page. If you have questions, please contact the clinic directly.",
        consentNoticeText: `CONSENT FOR COLLECTION, USE, AND DISCLOSURE OF PERSONAL INFORMATION

By submitting this form, I consent to the collection, use, and disclosure of my personal information, including personal health information, by this dental clinic for the following purposes:

1. Dental Treatment: To provide dental care and treatment, including diagnosis, treatment planning, and follow-up care.

2. Patient Records: To create and maintain patient records as required by the College of Dental Surgeons of British Columbia and applicable regulations.

3. Cross-Border Data Processing: I understand that my information may be processed using servers located outside of Canada (United States). My personal health information is encrypted before being transmitted and stored, meaning the service provider cannot access the content of my information.

Your Rights Under PIPA (Personal Information Protection Act, BC):
- You have the right to access your personal information held by the clinic.
- You have the right to request correction of your personal information.
- You may withdraw your consent at any time by contacting the clinic, subject to legal or contractual restrictions.
- Withdrawal of consent may affect our ability to provide dental services.

Retention: Your information will be retained in accordance with the clinic's retention policy and applicable regulations.

Contact: For questions about our privacy practices or to exercise your rights, please contact the clinic's Privacy Officer.`,
    },
    es: {
        pageEyebrow: "Registro del paciente",
        loading: "Cargando su formulario...",
        unavailableTitle: "Formulario no disponible",
        unavailableDescription:
            "Este enlace del formulario no es valido, ha vencido o ya fue enviado. Comuníquese con la clinica para solicitar un enlace nuevo.",
        secureBadge: "Envio cifrado",
        secureFormEyebrow: "Formulario seguro del paciente",
        shortFormHint:
            "Complete el formulario a continuacion y luego revise el aviso de consentimiento antes de enviarlo.",
        wizardTitle: "Progreso del formulario",
        wizardDescription:
            "Los formularios mas largos se dividen en pasos mas pequenos para que los pacientes avancen con mayor claridad.",
        reviewTitle: "Revisar y enviar",
        reviewDescription:
            "Confirme el consentimiento y luego envie el formulario completo a la clinica.",
        consentTitle:
            "Consentimiento para la recopilacion de informacion personal",
        consentToggleOpen: "Leer el texto completo del consentimiento",
        consentToggleClose: "Ocultar el texto completo del consentimiento",
        consentVersionLabel: "Version del consentimiento",
        consentAgreement:
            "He leido y acepto la recopilacion, el uso y la divulgacion de mi informacion personal segun se describe en el aviso de consentimiento anterior.",
        submit: "Enviar formulario",
        submitting: "Enviando...",
        next: "Siguiente paso",
        back: "Atras",
        stepOf: (current, total) => `Paso ${current} de ${total}`,
        percentComplete: (value) => `${value}% completado`,
        selectOption: "Seleccione una opcion",
        encryptedFooter:
            "Su informacion se cifra en transito y se almacena de forma segura para la clinica.",
        encryptedSubmission: "Envio cifrado",
        requiredField: (label) => `Se requiere ${label}`,
        invalidEmail: "Ingrese un correo electronico valido",
        invalidNumber: "Ingrese un numero valido",
        invalidSelection: "Elija una de las opciones disponibles",
        consentRequired:
            "Revise y acepte el aviso de consentimiento antes de enviar el formulario.",
        stepIncomplete: "Complete este paso antes de continuar",
        addressPlaceholder: "Comience a escribir su dirección...",
        unitPlaceholder: "Depto / Suite / Unidad",
        fixErrors:
            "Complete los campos obligatorios antes de enviar el formulario.",
        submittedTitle: "Formulario enviado correctamente",
        submittedDescription:
            "Gracias por completar su formulario de admision del paciente.",
        submittedBody:
            "Su informacion ha sido cifrada de forma segura y enviada a la clinica. El personal revisara su envio antes de su cita.",
        submittedCloseHint:
            "Puede cerrar esta pagina. Si tiene preguntas, comuníquese directamente con la clinica.",
        consentNoticeText: `CONSENTIMIENTO PARA LA RECOPILACIÓN, USO Y DIVULGACIÓN DE INFORMACIÓN PERSONAL

Al enviar este formulario, consiento la recopilación, el uso y la divulgación de mi información personal, incluida la información de salud personal, por parte de esta clínica dental para los siguientes fines:

1. Tratamiento dental: Para proporcionar atención y tratamiento dental, incluyendo diagnóstico, planificación de tratamiento y atención de seguimiento.

2. Expedientes de pacientes: Para crear y mantener los expedientes de pacientes según lo exigido por el Colegio de Cirujanos Dentales de Columbia Británica y las regulaciones aplicables.

3. Procesamiento transfronterizo de datos: Entiendo que mi información puede ser procesada utilizando servidores ubicados fuera de Canadá (Estados Unidos). Mi información de salud personal se cifra antes de ser transmitida y almacenada, lo que significa que el proveedor de servicios no puede acceder al contenido de mi información.

Sus derechos bajo PIPA (Ley de Protección de Información Personal, Columbia Británica):
- Tiene derecho a acceder a su información personal en poder de la clínica.
- Tiene derecho a solicitar la corrección de su información personal.
- Puede retirar su consentimiento en cualquier momento comunicándose con la clínica, sujeto a restricciones legales o contractuales.
- El retiro del consentimiento puede afectar nuestra capacidad para proporcionar servicios dentales.

Retención: Su información se conservará de acuerdo con la política de retención de la clínica y las regulaciones aplicables.

Contacto: Para preguntas sobre nuestras prácticas de privacidad o para ejercer sus derechos, comuníquese con el Oficial de Privacidad de la clínica.`,
    },
    ar: {
        pageEyebrow: "تسجيل المريض",
        loading: "جار تحميل النموذج...",
        unavailableTitle: "النموذج غير متاح",
        unavailableDescription:
            "رابط النموذج هذا غير صالح أو منتهي الصلاحية أو تم إرساله بالفعل. يرجى التواصل مع العيادة للحصول على رابط جديد.",
        secureBadge: "إرسال مشفر",
        secureFormEyebrow: "نموذج مريض آمن",
        shortFormHint:
            "يرجى إكمال النموذج أدناه ثم مراجعة إشعار الموافقة قبل الإرسال.",
        wizardTitle: "تقدم النموذج",
        wizardDescription:
            "يتم تقسيم النماذج الأطول إلى خطوات أصغر حتى يتمكن المرضى من إكمالها بوضوح أكبر.",
        reviewTitle: "المراجعة والإرسال",
        reviewDescription:
            "أكد الموافقة ثم أرسل نموذج الاستقبال المكتمل إلى العيادة.",
        consentTitle: "الموافقة على جمع المعلومات الشخصية",
        consentToggleOpen: "قراءة نص الموافقة الكامل",
        consentToggleClose: "إخفاء نص الموافقة الكامل",
        consentVersionLabel: "إصدار الموافقة",
        consentAgreement:
            "لقد قرأت وأوافق على جمع معلوماتي الشخصية واستخدامها والإفصاح عنها كما هو موضح في إشعار الموافقة أعلاه.",
        submit: "إرسال النموذج",
        submitting: "جار الإرسال...",
        next: "الخطوة التالية",
        back: "رجوع",
        stepOf: (current, total) => `الخطوة ${current} من ${total}`,
        percentComplete: (value) => `اكتمل ${value}%`,
        selectOption: "اختر خيارا",
        encryptedFooter:
            "يتم تشفير معلوماتك أثناء الإرسال وتخزينها بشكل آمن لصالح العيادة.",
        encryptedSubmission: "إرسال مشفر",
        requiredField: (label) => `حقل ${label} مطلوب`,
        invalidEmail: "يرجى إدخال بريد إلكتروني صالح",
        invalidNumber: "يرجى إدخال رقم صالح",
        invalidSelection: "يرجى اختيار أحد الخيارات المتاحة",
        consentRequired:
            "يرجى مراجعة إشعار الموافقة والموافقة عليه قبل إرسال النموذج.",
        stepIncomplete: "يرجى إكمال هذه الخطوة قبل المتابعة",
        addressPlaceholder: "ابدأ بكتابة عنوانك...",
        unitPlaceholder: "شقة / جناح / وحدة",
        fixErrors: "يرجى إكمال الحقول المطلوبة قبل إرسال النموذج.",
        submittedTitle: "تم إرسال النموذج بنجاح",
        submittedDescription: "شكرا لك على إكمال نموذج استقبال المريض.",
        submittedBody:
            "تم تشفير معلوماتك بشكل آمن وإرسالها إلى العيادة. سيقوم فريق العيادة بمراجعة الإرسال قبل موعدك.",
        submittedCloseHint:
            "يمكنك إغلاق هذه الصفحة. إذا كانت لديك أسئلة، يرجى التواصل مع العيادة مباشرة.",
        consentNoticeText: `الموافقة على جمع واستخدام والإفصاح عن المعلومات الشخصية

بإرسال هذا النموذج، أوافق على جمع واستخدام والإفصاح عن معلوماتي الشخصية، بما في ذلك المعلومات الصحية الشخصية، من قبل عيادة الأسنان هذه للأغراض التالية:

1. العلاج السني: لتقديم الرعاية والعلاج السني، بما في ذلك التشخيص وتخطيط العلاج والمتابعة.

2. سجلات المرضى: لإنشاء وصيانة سجلات المرضى وفقاً لمتطلبات كلية جراحي الأسنان في كولومبيا البريطانية واللوائح المعمول بها.

3. معالجة البيانات عبر الحدود: أفهم أن معلوماتي قد تتم معالجتها باستخدام خوادم موجودة خارج كندا (الولايات المتحدة). يتم تشفير معلوماتي الصحية الشخصية قبل إرسالها وتخزينها، مما يعني أن مزود الخدمة لا يمكنه الوصول إلى محتوى معلوماتي.

حقوقك بموجب قانون حماية المعلومات الشخصية (PIPA)، كولومبيا البريطانية:
- لديك الحق في الوصول إلى معلوماتك الشخصية المحفوظة لدى العيادة.
- لديك الحق في طلب تصحيح معلوماتك الشخصية.
- يمكنك سحب موافقتك في أي وقت بالتواصل مع العيادة، مع مراعاة القيود القانونية أو التعاقدية.
- قد يؤثر سحب الموافقة على قدرتنا على تقديم خدمات طب الأسنان.

الاحتفاظ: سيتم الاحتفاظ بمعلوماتك وفقاً لسياسة الاحتفاظ بالعيادة واللوائح المعمول بها.

للتواصل: لأي أسئلة حول ممارسات الخصوصية لدينا أو لممارسة حقوقك، يرجى التواصل مع مسؤول الخصوصية في العيادة.`,
    },
    "zh-Hans": {
        pageEyebrow: "患者登记",
        loading: "正在加载您的表单...",
        unavailableTitle: "表单不可用",
        unavailableDescription:
            "此表单链接无效、已过期或已提交。请联系诊所以获取新链接。",
        secureBadge: "加密提交",
        secureFormEyebrow: "安全患者表单",
        shortFormHint: "请先填写以下表单，然后在提交前查看同意说明。",
        wizardTitle: "表单进度",
        wizardDescription: "较长的表单会拆分为多个较小步骤，方便患者逐步完成。",
        reviewTitle: "审核并提交",
        reviewDescription: "确认同意后，将已完成的登记表发送给诊所。",
        consentTitle: "个人信息收集同意书",
        consentToggleOpen: "阅读完整同意内容",
        consentToggleClose: "隐藏完整同意内容",
        consentVersionLabel: "同意版本",
        consentAgreement:
            "我已阅读并同意按照上述同意说明收集、使用和披露我的个人信息。",
        submit: "提交表单",
        submitting: "正在提交...",
        next: "下一步",
        back: "返回",
        stepOf: (current, total) => `第 ${current} 步，共 ${total} 步`,
        percentComplete: (value) => `已完成 ${value}%`,
        selectOption: "请选择一项",
        encryptedFooter: "您的信息在传输过程中会被加密，并由诊所安全存储。",
        encryptedSubmission: "加密提交",
        requiredField: (label) => `${label} 为必填项`,
        invalidEmail: "请输入有效的电子邮箱",
        invalidNumber: "请输入有效数字",
        invalidSelection: "请选择可用选项之一",
        consentRequired: "请先阅读并同意同意说明后再提交。",
        stepIncomplete: "请先完成此步骤再继续",
        addressPlaceholder: "开始输入您的地址...",
        unitPlaceholder: "公寓 / 套房 / 单元",
        fixErrors: "请先完成必填字段后再提交。",
        submittedTitle: "表单提交成功",
        submittedDescription: "感谢您完成患者登记表。",
        submittedBody:
            "您的信息已被安全加密并发送至诊所。诊所工作人员会在您的预约前审核您的提交内容。",
        submittedCloseHint: "您现在可以关闭此页面。如有问题，请直接联系诊所。",
        consentNoticeText: `个人信息收集、使用和披露同意书

提交此表单即表示我同意本牙科诊所出于以下目的收集、使用和披露我的个人信息（包括个人健康信息）：

1. 牙科治疗：提供牙科护理和治疗，包括诊断、治疗计划和后续护理。

2. 患者记录：根据不列颠哥伦比亚省牙科医师学院及相关法规的要求，创建和维护患者记录。

3. 跨境数据处理：我了解我的信息可能使用位于加拿大境外（美国）的服务器进行处理。我的个人健康信息在传输和存储前会被加密，这意味着服务提供商无法访问我的信息内容。

您在《个人信息保护法》(PIPA，不列颠哥伦比亚省)下的权利：
- 您有权查阅诊所持有的您的个人信息。
- 您有权要求更正您的个人信息。
- 您可以随时联系诊所撤回您的同意，但须遵守法律或合同限制。
- 撤回同意可能影响我们提供牙科服务的能力。

保留：您的信息将根据诊所的保留政策和适用法规予以保留。

联系方式：如对我们的隐私惯例有疑问或需行使您的权利，请联系诊所的隐私官。`,
    },
    "zh-Hant": {
        pageEyebrow: "患者登記",
        loading: "正在載入您的表單...",
        unavailableTitle: "表單無法使用",
        unavailableDescription:
            "此表單連結無效、已過期或已提交。請聯絡診所以取得新連結。",
        secureBadge: "加密提交",
        secureFormEyebrow: "安全患者表單",
        shortFormHint: "請先填寫以下表單，並在提交前查看同意說明。",
        wizardTitle: "表單進度",
        wizardDescription: "較長的表單會拆分成較小步驟，方便患者逐步完成。",
        reviewTitle: "檢查並提交",
        reviewDescription: "確認同意後，將完成的登記表傳送給診所。",
        consentTitle: "個人資訊收集同意書",
        consentToggleOpen: "閱讀完整同意內容",
        consentToggleClose: "隱藏完整同意內容",
        consentVersionLabel: "同意版本",
        consentAgreement:
            "我已閱讀並同意依照上述同意說明收集、使用及揭露我的個人資訊。",
        submit: "提交表單",
        submitting: "正在提交...",
        next: "下一步",
        back: "返回",
        stepOf: (current, total) => `第 ${current} 步，共 ${total} 步`,
        percentComplete: (value) => `已完成 ${value}%`,
        selectOption: "請選擇一項",
        encryptedFooter: "您的資訊在傳輸過程中會被加密，並由診所安全儲存。",
        encryptedSubmission: "加密提交",
        requiredField: (label) => `${label} 為必填欄位`,
        invalidEmail: "請輸入有效的電子郵件",
        invalidNumber: "請輸入有效數字",
        invalidSelection: "請選擇其中一個可用選項",
        consentRequired: "請先閱讀並同意同意說明後再提交。",
        stepIncomplete: "請先完成此步驟再繼續",
        addressPlaceholder: "開始輸入您的地址...",
        unitPlaceholder: "公寓 / 套房 / 單元",
        fixErrors: "請先完成必填欄位後再提交。",
        submittedTitle: "表單提交成功",
        submittedDescription: "感謝您完成患者登記表。",
        submittedBody:
            "您的資訊已被安全加密並傳送至診所。診所工作人員會在您的預約前審核您的提交內容。",
        submittedCloseHint: "您現在可以關閉此頁面。如有問題，請直接聯絡診所。",
        consentNoticeText: `個人資訊收集、使用和揭露同意書

提交此表單即表示我同意本牙科診所出於以下目的收集、使用和揭露我的個人資訊（包括個人健康資訊）：

1. 牙科治療：提供牙科護理和治療，包括診斷、治療計畫和後續護理。

2. 患者記錄：根據不列顛哥倫比亞省牙科醫師學院及相關法規的要求，建立和維護患者記錄。

3. 跨境資料處理：我瞭解我的資訊可能使用位於加拿大境外（美國）的伺服器進行處理。我的個人健康資訊在傳輸和儲存前會被加密，這意味著服務提供商無法存取我的資訊內容。

您在《個人資訊保護法》(PIPA，不列顛哥倫比亞省)下的權利：
- 您有權查閱診所持有的您的個人資訊。
- 您有權要求更正您的個人資訊。
- 您可以隨時聯繫診所撤回您的同意，但須遵守法律或合約限制。
- 撤回同意可能影響我們提供牙科服務的能力。

保留：您的資訊將根據診所的保留政策和適用法規予以保留。

聯繫方式：如對我們的隱私慣例有疑問或需行使您的權利，請聯繫診所的隱私官。`,
    },
};
