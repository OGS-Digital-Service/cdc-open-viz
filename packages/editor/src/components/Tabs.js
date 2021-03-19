import React, { useState } from 'react';

const Tabs = ({ children, startingTab = 0, className }) => {
  const [active, setActive] = useState(startingTab);

  let containerClassName = 'tabs';

  if(className) {
    containerClassName = `tabs ${className}`;
  }

  const setActiveTab = (disabled, index) => {
    if(false === disabled) {
      setActive(index)
    }
  }

  const tabs = children.map(({props}, i) => {
    
    let classes = 'nav-item'

    let disabled = props.disableRule || false

    if(disabled) {
      classes += ' disabled';
    }

    if(i === active) {
      classes += ' active';
    }

    return (
    <li
      onClick={() => setActiveTab(disabled, i)}
      key={props.title}
      className={classes}
    >
      {props.icon}
      {props.title}
    </li>
    )
  })

  return (
    <>
      <nav className={containerClassName}>
        <ul className="nav nav-fill">
          {tabs}
        </ul>
      </nav>
      {children[active]}
    </>
  );
};

export default Tabs;