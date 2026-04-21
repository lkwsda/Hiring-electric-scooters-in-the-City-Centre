package org.example.dao;

import org.example.model.Issue;
import java.util.List;

public interface IssueDAO {
    // 1. 提交一张新的报修单
    void addIssue(Issue issue);

    // 2. 查看所有的报修单
    List<Issue> findAllIssues();
}