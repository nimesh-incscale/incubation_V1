"""Backend tests for Seed Fund Portfolio proxy endpoints."""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://grant-portfolio-view.preview.emergentagent.com").rstrip("/")


def _get(path, **kwargs):
    return requests.get(f"{BASE_URL}{path}", timeout=30, **kwargs)


# /api/portfolio
class TestPortfolio:
    def test_portfolio_shape_and_count(self):
        r = _get("/api/portfolio")
        assert r.status_code == 200, r.text
        body = r.json()
        assert "count" in body and "data" in body
        assert isinstance(body["data"], list)
        assert body["count"] == len(body["data"])
        assert body["count"] >= 100, f"Expected >=100 got {body['count']}"

    def test_portfolio_normalised_fields(self):
        r = _get("/api/portfolio")
        item = r.json()["data"][0]
        for key in [
            "id", "incubator_name", "sectors_list", "city", "state",
            "totalGrantremainingAmount", "first_total_approved_amt",
            "reapply_total_approved_amt", "totalRemainingAmount",
        ]:
            assert key in item, f"missing {key}"
        assert isinstance(item["sectors_list"], list)
        assert isinstance(item["totalGrantremainingAmount"], int)


# /api/portfolio/facets
class TestFacets:
    def test_facets_shape(self):
        r = _get("/api/portfolio/facets")
        assert r.status_code == 200
        body = r.json()
        for k in ["states", "cities", "incubators", "sectors", "ranges", "total"]:
            assert k in body
        for k in ["states", "cities", "incubators", "sectors"]:
            assert isinstance(body[k], list) and len(body[k]) > 0
        ranges = body["ranges"]
        for f in ["first_total_approved_amt", "reapply_total_approved_amt",
                  "totalRemainingAmount", "totalGrantremainingAmount"]:
            assert f in ranges
            assert "min" in ranges[f] and "max" in ranges[f]
            assert ranges[f]["max"] >= ranges[f]["min"]


# /api/portfolio/refresh
class TestRefresh:
    def test_refresh_returns_timestamp(self):
        r = _get("/api/portfolio/refresh")
        assert r.status_code == 200
        body = r.json()
        assert "refreshed_at" in body and body["refreshed_at"] > 0
        assert "count" in body and body["count"] >= 100
