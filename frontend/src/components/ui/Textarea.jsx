const Textarea = ({ className = '', ...props }) => (
  <textarea className={`input-base ${className}`} {...props} />
);

export default Textarea;
