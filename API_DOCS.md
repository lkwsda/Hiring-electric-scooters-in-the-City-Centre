## F13
### 1. User reports a new issue

*   **功能描述**: 用户提交一个关于某辆滑板车的故障报告。
*   **接口地址**: `POST /api/issues/report`
*   **请求方式**: `POST`
*   **请求格式**: `application/json`

*   **请求体 (Request Body) 示例**:
    ```json
    {
      "userId": 1,
      "scooterId": 2,
      "description": "The brake is not working properly.",
      "priority": "high"
    }
    ```
*   **参数说明**:
    | 参数名 | 类型 | 是否必填 | 说明 |
    |---|---|---|---|
    | `userId` | Integer | 是 | 报告该问题的用户 ID |
    | `scooterId` | Integer | 是 | 发生故障的滑板车 ID |
    | `description`| String | 是 | 故障的详细文字描述 |
    | `priority` | String | 否 | 优先级，可选值为 'low', 'medium', 'high'，默认为 'medium' |

*   **成功响应 (Success Response) 示例**:
    *   **状态码**: `200 OK`
    *   **内容**: `"Thank you! Your issue report has been submitted."`

---

### 2. For Admin: View all reported issues

*   **功能描述**: 管理员获取系统内所有的故障报告列表，按最新时间排序。
*   **接口地址**: `GET /api/issues`
*   **请求方式**: `GET`
*   **请求格式**: 无

*   **成功响应 (Success Response) 示例**:
    *   **状态码**: `200 OK`
    *   **内容**:
    ```json
    [
        {
            "id": 1,
            "userId": 1,
            "scooterId": 2,
            "description": "The brake is not working properly.",
            "status": "pending",
            "priority": "high",
            "reportedAt": "2026-04-15T10:30:00"
        },
        ...
    ]
    ```