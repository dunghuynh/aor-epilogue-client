'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _fetch = require('admin-on-rest/lib/util/fetch');

var _types = require('admin-on-rest/lib/rest/types');

/**
 * Maps admin-on-rest queries to a epilogue powered REST API
 *
 * @see https://github.com/dchester/epilogue
 * @example
 *
 * GET_LIST     => GET http://my.api.url/posts?sort=-title&page=0&count=10
 * GET_ONE      => GET http://my.api.url/posts/123
 * GET_MANY     => GET http://my.api.url/posts/123, GET http://my.api.url/posts/456, GET http://my.api.url/posts/789
 * UPDATE       => PUT http://my.api.url/posts/123
 * CREATE       => POST http://my.api.url/posts/123
 * DELETE       => DELETE http://my.api.url/posts/123
 */

var sortValue = function sortValue(_ref) {
  var field = _ref.field,
      order = _ref.order;

  return order === 'DESC' ? '-' + field : field;
};

function isEmpty(obj) {
  return !obj || Object.keys(obj).length === 0;
}

function getQuery(params) {
  var filter = params.filter,
      sort = params.sort,
      _params$pagination = params.pagination,
      page = _params$pagination.page,
      perPage = _params$pagination.perPage;

  var query = _extends({}, params.filter);
  if (!isEmpty(sort)) {
    query.sort = sortValue(sort);
  }
  if (!isEmpty(page)) {
    query.page = page - 1;
  }
  if (!isEmpty(perPage)) {
    query.count = perPage;
  }
  return query;
}

exports.default = function (apiUrl) {
  var httpClient = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _fetch.fetchJson;

  /**
     * @param {String} type One of the constants appearing at the top if this file, e.g. 'UPDATE'
     * @param {String} resource Name of the resource to fetch, e.g. 'posts'
     * @param {Object} params The REST request params, depending on the type
     * @returns {Object} { url, options } The HTTP request parameters
     */
  var convertRESTRequestToHTTP = function convertRESTRequestToHTTP(type, resource, params) {
    var url = '';
    var options = {};
    switch (type) {
      case _types.GET_LIST:
        {
          var query = getQuery(params);
          url = apiUrl + '/' + resource + '?' + (0, _fetch.queryParameters)(query);
          break;
        }
      case _types.GET_ONE:
        url = apiUrl + '/' + resource + '/' + params.id;
        break;
      case _types.GET_MANY_REFERENCE:
        {
          var _params$pagination2 = params.pagination,
              page = _params$pagination2.page,
              perPage = _params$pagination2.perPage;

          var _query = getQuery(params);
          _query[params.target] = params.id;
          url = apiUrl + '/' + resource + '?' + (0, _fetch.queryParameters)(_query);
          break;
        }
      case _types.UPDATE:
        url = apiUrl + '/' + resource + '/' + params.id;
        options.method = 'PUT';
        options.body = JSON.stringify(params.data);
        break;
      case _types.CREATE:
        url = apiUrl + '/' + resource;
        options.method = 'POST';
        options.body = JSON.stringify(params.data);
        break;
      case _types.DELETE:
        url = apiUrl + '/' + resource + '/' + params.id;
        options.method = 'DELETE';
        break;
      default:
        throw new Error('Unsupported fetch action type ' + type);
    }
    return { url: url, options: options };
  };

  /**
     * @param {Object} response HTTP response from fetch()
     * @param {String} type One of the constants appearing at the top if this file, e.g. 'UPDATE'
     * @param {String} resource Name of the resource to fetch, e.g. 'posts'
     * @param {Object} params The REST request params, depending on the type
     * @returns {Object} REST response
     */
  var convertHTTPResponseToREST = function convertHTTPResponseToREST(response, type, resource, params) {
    var headers = response.headers,
        json = response.json;

    switch (type) {
      case _types.GET_LIST:
      case _types.GET_MANY_REFERENCE:
        var headerName = 'Content-Range';
        if (!headers.has(headerName)) {
          throw new Error('The ' + headerName + ' header is missing in the HTTP Response. The jsonServer REST client expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare ' + headerName + ' in the Access-Control-Expose-Headers header? Example ' + headerName + ' value: items 0-9/100');
        }
        return {
          data: json,
          total: parseInt(headers.get(headerName).split('/').pop(), 10)
        };
      case _types.CREATE:
        return { data: _extends({}, params.data, { id: json.id }) };
      default:
        return { data: json };
    }
  };

  /**
     * @param {string} type Request type, e.g GET_LIST
     * @param {string} resource Resource name, e.g. "posts"
     * @param {Object} payload Request parameters. Depends on the request type
     * @returns {Promise} the Promise for a REST response
     */
  return function (type, resource, params) {
    // json-server doesn't handle WHERE IN requests, so we fallback to calling GET_ONE n times instead
    if (type === _types.GET_MANY) {
      return Promise.all(params.ids.map(function (id) {
        return httpClient(apiUrl + '/' + resource + '/' + id);
      })).then(function (responses) {
        return { data: responses.map(function (response) {
            return response.json;
          }) };
      });
    }

    var _convertRESTRequestTo = convertRESTRequestToHTTP(type, resource, params),
        url = _convertRESTRequestTo.url,
        options = _convertRESTRequestTo.options;

    return httpClient(url, options).then(function (response) {
      return convertHTTPResponseToREST(response, type, resource, params);
    });
  };
};

module.exports = exports['default'];
//# sourceMappingURL=index.js.map