import React, {PropTypes} from 'react';
import createElement from 'recompose/createElement';
import BaseInput from './Input';
import BaseTextarea from './Textarea';
import BaseSelect from './Select';

function inForm(Control, {
  extractValueFromOnChange = event => event.target.value
} = {}) {
  return class WrappedControl extends React.Component {
    static propTypes = {
      name: PropTypes.string.isRequired
    };

    static contextTypes = {
      form: PropTypes.object.isRequired
    };

    componentWillMount() {
      this.context.form.addControl(this);
    }

    componentWillUnmount() {
      this.context.form.removeControl(this);
    }

    onChange = (...args) => {
      if (this.props.onChange)
        this.props.onChange(...args);

      const value = extractValueFromOnChange(...args);
      this.context.form.setValue(this.props.name, value);
    }

    render() {
      return createElement(Control, {
        ...this.props,
        onChange: this.onChange,
        value: this.context.form.getValue(this.props.name)
      });
    }
  };
}

export const Input = inForm(BaseInput);
export const Select = inForm(BaseSelect, {
  extractValueFromOnChange: item => {
    if (typeof item === 'string')
      return item ? Array.from(new Set(item.toLowerCase().split(','))) : [];

    return item.value;
  }
});
export const Textarea = inForm(BaseTextarea);

export default class Form extends React.Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
    onModelChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
  };

  static childContextTypes = {
    form: PropTypes.object.isRequired
  };

  getChildContext() {
    return {
      form: {
        addControl: this.addControl,
        removeControl: this.removeControl,
        setValue: this.setValue,
        getValue: this.getValue
      }
    };
  }

  componentDidUpdate() {
    this.controls.forEach(control => {
      control.forceUpdate();
    });
  }

  controls = [];

  addControl = control => {
    this.controls.push(control);
  };

  removeControl = control => {
    const index = this.controls.indexOf(control);

    if (index !== -1)
      this.controls.splice(index, 1);
  };

  setValue = (name, value) => {
    const model = {...this.props.model, [name]: value};
    this.props.onModelChange(model);
  };

  getValue = name => this.props.model[name];

  onSubmit = event => {
    event.preventDefault();
    this.props.onSubmit(this.props.model, event);
  };

  render() {
    const {children, model, onSubmit, ...props} = this.props;

    return (
      <form {...props} onSubmit={this.onSubmit}>
        {children}
      </form>
    );
  }
}
