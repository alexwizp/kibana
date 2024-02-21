/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiText, EuiCard } from '@elastic/eui';
import { css } from '@emotion/react';
import { getKibanaLinkProps } from './utils';
import type { NavigationLink } from '../types';

export interface LandingLinksIconsProps {
  items: Readonly<NavigationLink[]>;
  urlState?: string;
  onLinkClick?: (id: string) => void;
}
export interface LandingLinkIconProps {
  item: NavigationLink;
  urlState?: string;
  onLinkClick?: (id: string) => void;
}

export const LandingLinkIcon: React.FC<LandingLinkIconProps> = React.memo(function LandingLinkIcon({
  item,
  onLinkClick,
  urlState,
  children,
}) {
  const { title, description, landingIcon, isBeta, betaOptions } = item;

  return (
    <EuiCard
      layout="horizontal"
      data-test-subj="LandingItem"
      icon={<EuiIcon aria-hidden="true" size="xl" type={landingIcon ?? ''} role="presentation" />}
      titleSize="xs"
      titleElement="h3"
      betaBadgeProps={
        isBeta
          ? {
              label: betaOptions?.text ?? '',
            }
          : undefined
      }
      title={title}
      description={<EuiText size="s">{description}</EuiText>}
      {...getKibanaLinkProps({
        item,
        urlState,
        onLinkClick,
      })}
    >
      {children}
    </EuiCard>
  );
});

const linkIconContainerStyles = css`
  width: 22em;
`;
export const LandingLinksIcons: React.FC<LandingLinksIconsProps> = ({
  items,
  onLinkClick,
  urlState,
}) => {
  return (
    <EuiFlexGroup gutterSize="xl" wrap direction="row">
      {items.map((item) => (
        <EuiFlexItem key={item.id} grow={false} css={linkIconContainerStyles}>
          <LandingLinkIcon item={item} urlState={urlState} onLinkClick={onLinkClick} />
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
  );
};

// eslint-disable-next-line import/no-default-export
export default LandingLinksIcons;
