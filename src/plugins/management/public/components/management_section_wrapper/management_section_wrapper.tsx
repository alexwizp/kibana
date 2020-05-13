/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useEffect, createRef, useRef, RefObject } from 'react';
import { ManagementItem } from '../../management_item';
import { Unmount } from '../../types';

interface ManagementSectionWrapperProps {
  section: ManagementItem;
}

export const ManagementSectionWrapper = ({ section }: ManagementSectionWrapperProps) => {
  const mountElementRef = useRef<RefObject<any>>();
  const { mount, basePath } = section;
  const unmount = useRef<Unmount>();

  mountElementRef.current = createRef<HTMLDivElement>();

  useEffect(() => {
    if (mount && basePath) {
      const mountResult = mount({
        basePath,
        element: mountElementRef.current!.current,
        setBreadcrumbs: () => 'todo',
      });

      if (mountResult instanceof Promise) {
        mountResult.then(um => {
          unmount.current = um;
        });
      } else {
        unmount.current = mountResult;
      }
      return () => {
        if (unmount.current) {
          unmount.current();
        }
      };
    }
  }, [basePath, mount]);

  return <div ref={mountElementRef.current} />;
};
