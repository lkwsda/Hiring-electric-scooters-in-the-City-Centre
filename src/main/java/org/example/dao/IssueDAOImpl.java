package org.example.dao;

import org.example.model.Issue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
public class IssueDAOImpl implements IssueDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void addIssue(Issue issue) {
        String sql = "INSERT INTO issues (user_id, scooter_id, description, priority) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql, issue.getUserId(), issue.getScooterId(), issue.getDescription(), issue.getPriority());
    }

    @Override
    public List<Issue> findAllIssues() {
        String sql = "SELECT * FROM issues ORDER BY reported_at DESC";

        return jdbcTemplate.query(sql, new IssueRowMapper());
    }

    private static class IssueRowMapper implements RowMapper<Issue> {
        @Override
        public Issue mapRow(ResultSet rs, int rowNum) throws SQLException {
            Issue i = new Issue();
            i.setId(rs.getInt("id"));
            i.setUserId(rs.getInt("user_id"));
            i.setScooterId(rs.getInt("scooter_id"));
            i.setDescription(rs.getString("description"));
            i.setStatus(rs.getString("status"));
            i.setPriority(rs.getString("priority"));
            i.setReportedAt(rs.getTimestamp("reported_at").toLocalDateTime());
            return i;
        }
    }

    // f14
    @Override
    public void updateStatus(int issueId, String status) {
        String sql = "UPDATE issues SET status = ? WHERE id = ?";
        jdbcTemplate.update(sql, status, issueId);
    }
}