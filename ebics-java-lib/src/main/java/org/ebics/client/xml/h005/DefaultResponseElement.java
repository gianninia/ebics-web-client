/*
 * Copyright (c) 1990-2012 kopiLeft Development SARL, Bizerte, Tunisia
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License version 2.1 as published by the Free Software Foundation.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
 *
 * $Id$
 */

package org.ebics.client.xml.h005;

import org.apache.xmlbeans.XmlException;
import org.apache.xmlbeans.XmlObject;
import org.apache.xmlbeans.impl.schema.DocumentFactory;
import org.ebics.client.exception.EbicsException;
import org.ebics.client.exception.h005.EbicsReturnCode;
import org.ebics.client.interfaces.ContentFactory;

import java.io.IOException;


/**
 * The <code>DefaultResponseElement</code> is the common element for
 * all ebics server responses.
 *
 * @author Hachani
 *
 */
public abstract class DefaultResponseElement<T extends XmlObject> extends DefaultEbicsRootElement<T> {
  /**
   * Constructs a new ebics response element.
   * @param factory the content factory containing the response.
   */
  public DefaultResponseElement(ContentFactory factory) {
    this.factory = factory;
  }

  /**
   * Parses the content of a <code>ContentFactory</code>
   * @param factory the content factory
   * @throws EbicsException parse error
   */
  protected void parse(DocumentFactory<T> documentFactory) throws EbicsException {
    try {
      document = documentFactory.parse(factory.getContent());
    } catch (XmlException e) {
      throw new EbicsException(e.getMessage());
    } catch (IOException e) {
      throw new EbicsException(e.getMessage());
    }
  }

  /**
   * Reports the return code to the user.
   * @throws EbicsException request fails.
   */
  public void report() throws EbicsException {
    checkReturnCode(returnCode);
  }

  protected void checkReturnCode(EbicsReturnCode returnCode) throws EbicsException {
    if (!returnCode.isOk()) {
      returnCode.throwException();
    }
  }

  // --------------------------------------------------------------------
  // DATA MEMBERS
  // --------------------------------------------------------------------

  protected ContentFactory		factory;
  protected EbicsReturnCode returnCode;
  private static final long 		serialVersionUID = 4014595046719645090L;
}
