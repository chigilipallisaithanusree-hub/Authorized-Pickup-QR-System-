import React from 'react';

const Loader = ({ count = 3, height = '48px', margin = '12px' }) => {
  const skeletons = Array.from({ length: count });

  return (
    <div style={{ width: '100%' }}>
      {skeletons.map((_, index) => (
        <div
          key={index}
          className="skeleton"
          style={{
            height,
            marginBottom: index !== skeletons.length - 1 ? margin : 0,
            width: '100%',
            borderRadius: '8px'
          }}
        />
      ))}
    </div>
  );
};

export default Loader;
